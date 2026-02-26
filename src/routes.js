const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const bcrypt = require('bcryptjs');
const multer = require('multer');
const unzipper = require('unzipper');

const {
  APP_NAME,
  ADMIN_USER,
  ADMIN_PASSWORD_HASH,
  BACKUP_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR,
  OPENCLAW_DIR,
  WORKSPACE_FILES,
  WORKSPACE_DIR
} = require('./config');

const { renderPage } = require('./views');
const { createBackupZip, removePath, copyRecursive } = require('./utils');

const upload = multer({ dest: UPLOAD_DIR });

function isAuthed(req, res, next) {
  if (req.session?.authed) return next();
  return res.redirect('/login');
}

router.get('/', (req, res) => {
  if (!req.session?.authed) return res.redirect('/login');
  return res.redirect('/wizard');
});

router.get('/logo.jpg', (req, res) => {
  const guessed = path.resolve('/root/.openclaw/workspace/openclaw-model-gui/web/public/logo.jpg');
  if (fs.existsSync(guessed)) return res.sendFile(guessed);
  res.status(404).send('logo not found');
});

router.get('/login', (req, res) => {
  const body = `
    <div class="card login-card">
      <h2>Login</h2>
      <form method="post" action="/login" class="stack">
        <label>Username <input required name="username" class="input-field" /></label>
        <label>Password <input required name="password" type="password" class="input-field" /></label>
        <button type="submit" class="btn btn-primary">Sign in</button>
      </form>
    </div>`;
  res.send(renderPage({ title: `${APP_NAME} - Login`, body }));
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).send(renderPage({
      title: `${APP_NAME} - Login`,
      body: '<div class="card error-card">ADMIN_PASSWORD_HASH missing in .env</div>'
    }));
  }

  const ok = username === ADMIN_USER && await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH);
  if (!ok) {
    return res.status(401).send(renderPage({ title: `${APP_NAME} - Login`, body: '<div class="card error-card">Invalid login.</div>' }));
  }

  req.session.authed = true;
  res.redirect('/wizard');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/wizard', isAuthed, async (req, res) => {
  let backups = [];
  if (fs.existsSync(BACKUP_DIR)) {
    try {
      backups = (await fsp.readdir(BACKUP_DIR))
        .filter(f => f.endsWith('.zip'))
        .map(f => {
            const stats = fs.statSync(path.join(BACKUP_DIR, f));
            return { name: f, time: stats.mtime.getTime(), size: stats.size };
        })
        .sort((a, b) => b.time - a.time); // Default sort by newest
    } catch (e) {
      console.error("Error reading backups:", e);
    }
  }

  const listItems = backups.map(b => `
      <li data-name="${b.name}" data-time="${b.time}">
        <div class="backup-info">
            <a href="/download/${encodeURIComponent(b.name)}" class="backup-name">${b.name}</a>
            <span class="backup-meta">${new Date(b.time).toLocaleString()} - ${(b.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div class="actions">
            <a href="/download/${encodeURIComponent(b.name)}" class="btn btn-sm btn-secondary">Download</a>
            <form method="post" action="/delete-backup" onsubmit="return confirm('Delete backup ${b.name}?');" style="display:inline;">
            <input type="hidden" name="name" value="${b.name}" />
            <button type="submit" class="btn btn-sm btn-danger">Delete</button>
            </form>
        </div>
      </li>
    `).join('');

  const list = backups.length
    ? `<ul class="backup-list" id="backupList">${listItems}</ul>`
    : '<p id="noBackupsMsg">No backups yet.</p>';

  const body = `
    <div class="grid dashboard-grid">
      <section class="card action-card">
        <h2>Create Backup</h2>
        <p>Backs up OpenClaw state + key workspace memory/config files into a ZIP.</p>
        <form method="post" action="/backup"><button type="submit" class="btn btn-primary full-width">Backup Now</button></form>
      </section>

      <section class="card action-card">
        <h2>Restore Backup</h2>
        <p>Uploads a ZIP from this wizard format and restores files. A pre-restore emergency backup is generated automatically.</p>
        <form method="post" action="/restore" enctype="multipart/form-data" class="stack">
          <div class="file-input-wrapper">
             <input type="file" name="backup" accept=".zip" required class="input-file" />
          </div>
          <label class="checkbox"><input type="checkbox" required name="confirm" value="yes" /> I understand this will overwrite current OpenClaw files.</label>
          <button type="submit" class="btn btn-danger full-width">Restore Backup</button>
        </form>
      </section>

      <section class="card full-width-card">
        <div class="card-header">
            <h2>Backups</h2>
            <div class="controls">
                <input type="text" id="searchInput" placeholder="Search backups..." class="input-search">
                <select id="sortSelect" class="input-select">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                </select>
            </div>
        </div>
        ${list}
      </section>

      <section class="card session-card">
        <h2>Session</h2>
        <form method="post" action="/logout"><button type="submit" class="btn btn-secondary">Logout</button></form>
      </section>
    </div>`;

  res.send(renderPage({ title: `${APP_NAME} - Wizard`, body, status: req.query.ok ? decodeURIComponent(req.query.ok) : '' }));
});

router.post('/backup', isAuthed, async (req, res) => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `openclaw-backup-${stamp}.zip`);

    await createBackupZip(backupFile);

    res.redirect(`/wizard?ok=${encodeURIComponent(`Backup created: ${path.basename(backupFile)}`)}`);
  } catch (err) {
    res.status(500).send(renderPage({ title: `${APP_NAME} - Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

router.get('/download/:name', isAuthed, async (req, res) => {
  const target = path.basename(req.params.name);
  const file = path.join(BACKUP_DIR, target);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.download(file);
});

router.post('/delete-backup', isAuthed, async (req, res) => {
  try {
    const target = path.basename(String(req.body?.name || ''));
    if (!target.endsWith('.zip')) {
      return res.redirect(`/wizard?ok=${encodeURIComponent('Invalid backup name.')}`);
    }

    const file = path.join(BACKUP_DIR, target);
    if (!fs.existsSync(file)) {
      return res.redirect(`/wizard?ok=${encodeURIComponent('Backup not found.')}`);
    }

    await fsp.unlink(file);
    return res.redirect(`/wizard?ok=${encodeURIComponent(`Backup deleted: ${target}`)}`);
  } catch (err) {
    return res.status(500).send(renderPage({ title: `${APP_NAME} - Delete Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

router.post('/restore', isAuthed, upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No backup uploaded');
    if (req.body.confirm !== 'yes') throw new Error('Confirmation required');

    const preRestoreFile = path.join(BACKUP_DIR, `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`);
    await createBackupZip(preRestoreFile);

    await removePath(TMP_RESTORE_DIR);
    await fsp.mkdir(TMP_RESTORE_DIR, { recursive: true });

    await fs.createReadStream(req.file.path)
      .pipe(unzipper.Extract({ path: TMP_RESTORE_DIR }))
      .promise();

    const srcOpenclaw = path.join(TMP_RESTORE_DIR, 'openclaw_state');
    const srcWorkspace = path.join(TMP_RESTORE_DIR, 'workspace_files');

    if (fs.existsSync(srcOpenclaw)) {
      await copyRecursive(srcOpenclaw, OPENCLAW_DIR);
    }

    if (fs.existsSync(srcWorkspace)) {
      for (const rel of WORKSPACE_FILES) {
        const src = path.join(srcWorkspace, rel);
        if (fs.existsSync(src)) {
          await copyRecursive(src, path.join(WORKSPACE_DIR, rel));
        }
      }
    }

    await removePath(req.file.path);
    await removePath(TMP_RESTORE_DIR);

    res.redirect(`/wizard?ok=${encodeURIComponent('Restore completed. A pre-restore backup was created automatically.')}`);
  } catch (err) {
    res.status(500).send(renderPage({ title: `${APP_NAME} - Restore Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

module.exports = router;
