import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import {
  SESSION_SECRET,
  UPLOAD_DIR,
  APP_NAME,
  LOGO_PATH,
  BACKUP_DIR,
  WORKSPACE_DIR
} from './config.js';
import { isAuthed, verifyLogin } from './lib/auth.js';
import { createBackupZip, restoreBackup, getBackups, deleteBackup } from './lib/backup.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for simplicity with inline scripts/styles if any, or adjust
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

const upload = multer({ dest: UPLOAD_DIR });

// Static files
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// View Helper
function renderPage({ title, body, status = '', scripts = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="/static/style.css" />
  <script src="/static/script.js" defer></script>
  ${scripts}
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <img src="${LOGO_PATH}" onerror="this.style.display='none'" class="logo" alt="logo" />
        <h1>${APP_NAME}</h1>
      </div>
      <button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
        <span class="icon">🌙</span>
      </button>
    </header>
    ${status ? `<div class="status" role="alert">${status}</div>` : ''}
    <main>
      ${body}
    </main>
    <footer class="footer">
      <span>Project by Graham Miranda </span>
      <a href="https://www.grahammiranda.com/" target="_blank" rel="noopener noreferrer">https://www.grahammiranda.com/</a>
    </footer>
  </div>
</body>
</html>`;
}

// Routes
app.get('/', (req, res) => {
  if (!req.session?.authed) return res.redirect('/login');
  return res.redirect('/wizard');
});

// Legacy logo route
app.get('/logo.jpg', (req, res) => {
  const guessed = path.join(WORKSPACE_DIR, 'openclaw-model-gui/web/public/logo.jpg');
  if (fs.existsSync(guessed)) return res.sendFile(guessed);
  res.status(404).send('logo not found');
});

app.get('/login', (req, res) => {
  const body = `
    <div class="card login-card">
      <h2>Login</h2>
      <form method="post" action="/login" class="stack">
        <div class="field">
          <label for="username">Username</label>
          <input required name="username" id="username" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input required name="password" type="password" id="password" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn-primary">Sign in</button>
      </form>
    </div>`;
  res.send(renderPage({ title: `${APP_NAME} - Login`, body }));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const ok = await verifyLogin(username, password);
    if (!ok) {
      return res.status(401).send(renderPage({ title: `${APP_NAME} - Login`, body: '<div class="card error">Invalid login. <a href="/login">Try again</a></div>' }));
    }
    req.session.authed = true;
    res.redirect('/wizard');
  } catch (err) {
    res.status(500).send(renderPage({ title: 'Error', body: `<div class="card error">${err.message}</div>` }));
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/wizard', isAuthed, async (req, res) => {
  const backups = await getBackups();

  const list = backups.length
    ? `<ul class="backup-list">${backups.map(b => `
      <li>
        <span class="backup-name">${b}</span>
        <div class="actions">
          <a href="/download/${encodeURIComponent(b)}" class="btn-sm">Download</a>
          <form method="post" action="/delete-backup" onsubmit="return confirm('Delete backup ${b}?');" style="display:inline;">
            <input type="hidden" name="name" value="${b}" />
            <button type="submit" class="btn-sm danger">Delete</button>
          </form>
        </div>
      </li>
    `).join('')}</ul>`
    : '<p class="empty-state">No backups yet.</p>';

  const body = `
    <div class="grid">
      <section class="card">
        <div class="card-header">
            <h2>Create Backup</h2>
            <span class="badge">Step 1</span>
        </div>
        <p>Backs up OpenClaw state + key workspace memory/config files into a ZIP.</p>
        <form method="post" action="/backup" class="action-form">
            <button type="submit" class="btn-primary" data-loading="Backing up...">Backup now</button>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
            <h2>Restore Backup</h2>
            <span class="badge">Step 2</span>
        </div>
        <p>Uploads a ZIP from this wizard format and restores files. A pre-restore emergency backup is generated automatically.</p>
        <form method="post" action="/restore" enctype="multipart/form-data" class="stack action-form">
          <div class="file-input-wrapper">
             <input type="file" name="backup" accept=".zip" required id="backupFile" />
          </div>
          <label class="checkbox">
            <input type="checkbox" required name="confirm" value="yes" />
            I understand this will overwrite current OpenClaw files.
          </label>
          <button type="submit" class="btn-danger" data-loading="Restoring...">Restore backup</button>
        </form>
      </section>

      <section class="card full-width">
        <h2>Existing Backups</h2>
        ${list}
      </section>

      <section class="card full-width session-card">
        <h2>Session</h2>
        <form method="post" action="/logout"><button type="submit" class="btn-ghost">Logout</button></form>
      </section>
    </div>`;

  res.send(renderPage({ title: `${APP_NAME} - Wizard`, body, status: req.query.ok ? decodeURIComponent(req.query.ok) : '' }));
});

app.post('/backup', isAuthed, async (req, res) => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `openclaw-backup-${stamp}.zip`);

    await createBackupZip(backupFile);

    res.redirect(`/wizard?ok=${encodeURIComponent(`Backup created: ${path.basename(backupFile)}`)}`);
  } catch (err) {
    res.status(500).send(renderPage({ title: `${APP_NAME} - Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

app.get('/download/:name', isAuthed, (req, res) => {
  const target = path.basename(req.params.name);
  const file = path.join(BACKUP_DIR, target);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.download(file);
});

app.post('/delete-backup', isAuthed, async (req, res) => {
  try {
    const target = path.basename(String(req.body?.name || ''));
    if (!target.endsWith('.zip')) {
      return res.redirect(`/wizard?ok=${encodeURIComponent('Invalid backup name.')}`);
    }

    const deleted = await deleteBackup(target);
    if (!deleted) {
      return res.redirect(`/wizard?ok=${encodeURIComponent('Backup not found.')}`);
    }

    return res.redirect(`/wizard?ok=${encodeURIComponent(`Backup deleted: ${target}`)}`);
  } catch (err) {
    return res.status(500).send(renderPage({ title: `${APP_NAME} - Delete Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

app.post('/restore', isAuthed, upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No backup uploaded');
    if (req.body.confirm !== 'yes') throw new Error('Confirmation required');

    await restoreBackup(req.file.path);

    // Clean up uploaded file
    await fs.promises.unlink(req.file.path);

    res.redirect(`/wizard?ok=${encodeURIComponent('Restore completed. A pre-restore backup was created automatically.')}`);
  } catch (err) {
    // Clean up uploaded file if error
    if (req.file && fs.existsSync(req.file.path)) {
       await fs.promises.unlink(req.file.path).catch(() => {});
    }
    res.status(500).send(renderPage({ title: `${APP_NAME} - Restore Error`, body: `<pre>${String(err.stack || err)}</pre>` }));
  }
});

export default app;
