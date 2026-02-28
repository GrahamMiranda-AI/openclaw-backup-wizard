import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import unzipper from 'unzipper';
import {
  APP_NAME,
  ADMIN_USER,
  ADMIN_PASSWORD_HASH,
  HOME_DIR,
  BACKUP_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR,
  OPENCLAW_DIR,
  WORKSPACE_DIR,
  WORKSPACE_FILES
} from './config.js';
import { renderPage } from './views.js';
import { createBackupZip, removePath, copyRecursive } from './utils.js';

const fsp = fs.promises;
const router = express.Router();
const upload = multer({ dest: UPLOAD_DIR });

export function isAuthed(req, res, next) {
  if (req.session?.authed) return next();
  return res.redirect('/login');
}

router.get('/', (req, res) => {
  if (!req.session?.authed) return res.redirect('/login');
  return res.redirect('/wizard');
});

router.get('/logo.jpg', (req, res) => {
  const guessed = path.resolve(path.join(HOME_DIR, '.openclaw/workspace/openclaw-model-gui/web/public/logo.jpg'));
  if (fs.existsSync(guessed)) return res.sendFile(guessed);
  res.status(404).send('logo not found');
});

router.get('/login', (req, res) => {
  const body = `
    <div class="card">
      <h2>Login</h2>
      <form method="post" action="/login" class="stack">
        <label>Username <input required name="username" /></label>
        <label>Password <input required name="password" type="password" /></label>
        <button type="submit">Sign in</button>
      </form>
    </div>`;
  res.send(renderPage({ title: `${APP_NAME} - Login`, body }));
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).send(renderPage({
      title: `${APP_NAME} - Login`,
      body: '<div class="card">ADMIN_PASSWORD_HASH missing in .env</div>'
    }));
  }

  const ok = username === ADMIN_USER && await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH);
  if (!ok) {
    return res.status(401).send(renderPage({ title: `${APP_NAME} - Login`, body: '<div class="card">Invalid login.</div>' }));
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
    backups = (await fsp.readdir(BACKUP_DIR)).filter(f => f.endsWith('.zip')).sort().reverse();
  }

  const list = backups.length
    ? `<ul class="backup-list">${backups.map(b => `
      <li>
        <a href="/download/${encodeURIComponent(b)}">${b}</a>
        <form method="post" action="/delete-backup" onsubmit="return confirm('Delete backup ${b}?');">
          <input type="hidden" name="name" value="${b}" />
          <button type="submit" class="danger ghost">Delete</button>
        </form>
      </li>
    `).join('')}</ul>`
    : '<p>No backups yet.</p>';

  const body = `
    <div class="grid">
      <section class="card">
        <h2>Step 1 — Create backup</h2>
        <p>Backs up OpenClaw state + key workspace memory/config files into a ZIP.</p>
        <form method="post" action="/backup"><button type="submit">Backup now</button></form>
      </section>

      <section class="card">
        <h2>Step 2 — Restore backup</h2>
        <p>Uploads a ZIP from this wizard format and restores files. A pre-restore emergency backup is generated automatically.</p>
        <form method="post" action="/restore" enctype="multipart/form-data" class="stack">
          <input type="file" name="backup" accept=".zip" required />
          <label class="checkbox"><input type="checkbox" required name="confirm" value="yes" /> I understand this will overwrite current OpenClaw files.</label>
          <button type="submit" class="danger">Restore backup</button>
        </form>
      </section>

      <section class="card">
        <h2>Backups</h2>
        ${list}
      </section>

      <section class="card">
        <h2>Session</h2>
        <form method="post" action="/logout"><button type="submit">Logout</button></form>
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

export default router;