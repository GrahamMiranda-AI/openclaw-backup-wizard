require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const archiver = require('archiver');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const unzipper = require('unzipper');

const app = express();
const PORT = Number(process.env.PORT || 4280);
const APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const LOGO_PATH = process.env.LOGO_PATH || '/logo.jpg';

const HOME_DIR = process.env.HOME || '/root';
const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');
const WORKSPACE_DIR = '/root/.openclaw/workspace';
const BACKUP_DIR = path.join(__dirname, 'backups');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TMP_RESTORE_DIR = path.join(__dirname, '.tmp-restore');

const WORKSPACE_FILES = [
  'AGENTS.md',
  'SOUL.md',
  'USER.md',
  'TOOLS.md',
  'IDENTITY.md',
  'HEARTBEAT.md',
  'MEMORY.md',
  'memory'
];

for (const p of [BACKUP_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

app.use('/static', express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: UPLOAD_DIR });

function isAuthed(req, res, next) {
  if (req.session?.authed) return next();
  return res.redirect('/login');
}

function renderPage({ title, body, status = '' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <div class="wrap">
    <header>
      <img src="${LOGO_PATH}" onerror="this.style.display='none'" class="logo" alt="logo" />
      <h1>${APP_NAME}</h1>
    </header>
    ${status ? `<div class="status">${status}</div>` : ''}
    ${body}
  </div>
</body>
</html>`;
}

async function copyRecursive(src, dst) {
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  await fsp.cp(src, dst, { recursive: true, force: true });
}

async function createSnapshotDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotRoot = path.join(__dirname, `.snapshot-${stamp}`);
  await fsp.mkdir(snapshotRoot, { recursive: true });

  const openclawTarget = path.join(snapshotRoot, 'openclaw_state');
  if (fs.existsSync(OPENCLAW_DIR)) {
    await copyRecursive(OPENCLAW_DIR, openclawTarget);
  }

  const workspaceTarget = path.join(snapshotRoot, 'workspace_files');
  await fsp.mkdir(workspaceTarget, { recursive: true });
  for (const rel of WORKSPACE_FILES) {
    const src = path.join(WORKSPACE_DIR, rel);
    if (fs.existsSync(src)) {
      await copyRecursive(src, path.join(workspaceTarget, rel));
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    app: APP_NAME,
    includes: {
      openclawState: OPENCLAW_DIR,
      workspace: WORKSPACE_FILES
    }
  };
  await fsp.writeFile(path.join(snapshotRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  return snapshotRoot;
}

async function zipDir(sourceDir, outFile) {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function removePath(target) {
  if (fs.existsSync(target)) {
    await fsp.rm(target, { recursive: true, force: true });
  }
}

app.get('/', (req, res) => {
  if (!req.session?.authed) return res.redirect('/login');
  return res.redirect('/wizard');
});

app.get('/logo.jpg', (req, res) => {
  const guessed = path.resolve('/root/.openclaw/workspace/openclaw-model-gui/web/public/logo.jpg');
  if (fs.existsSync(guessed)) return res.sendFile(guessed);
  res.status(404).send('logo not found');
});

app.get('/login', (req, res) => {
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

app.post('/login', async (req, res) => {
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

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/wizard', isAuthed, async (req, res) => {
  let backups = [];
  if (fs.existsSync(BACKUP_DIR)) {
    backups = (await fsp.readdir(BACKUP_DIR)).filter(f => f.endsWith('.zip')).sort().reverse();
  }

  const list = backups.length
    ? `<ul>${backups.map(b => `<li><a href="/download/${encodeURIComponent(b)}">${b}</a></li>`).join('')}</ul>`
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

app.post('/backup', isAuthed, async (req, res) => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotDir = await createSnapshotDir();
    const backupFile = path.join(BACKUP_DIR, `openclaw-backup-${stamp}.zip`);

    await zipDir(snapshotDir, backupFile);
    await removePath(snapshotDir);

    res.redirect(`/wizard?ok=${encodeURIComponent(`Backup created: ${path.basename(backupFile)}`)}`);
  } catch (err) {
    res.status(500).send(renderPage({ title: `${APP_NAME} - Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

app.get('/download/:name', isAuthed, async (req, res) => {
  const target = path.basename(req.params.name);
  const file = path.join(BACKUP_DIR, target);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.download(file);
});

app.post('/restore', isAuthed, upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No backup uploaded');
    if (req.body.confirm !== 'yes') throw new Error('Confirmation required');

    const preRestoreSnapshot = await createSnapshotDir();
    const preRestoreFile = path.join(BACKUP_DIR, `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`);
    await zipDir(preRestoreSnapshot, preRestoreFile);
    await removePath(preRestoreSnapshot);

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

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
