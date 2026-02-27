const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const bcrypt = require('bcryptjs');
const multer = require('multer');

const {
  BACKUP_DIR,
  APP_NAME,
  ADMIN_USER,
  ADMIN_PASSWORD_HASH,
  UPLOAD_DIR
} = require('./config');

const {
  createBackupZip,
  restoreBackup,
  removePath
} = require('./utils');

const {
  renderLogin,
  renderWizard,
  renderError,
  renderLayout
} = require('./views');

const upload = multer({ dest: UPLOAD_DIR });

// Middleware for authentication
function isAuthed(req, res, next) {
  if (req.session?.authed) return next();
  return res.redirect('/login');
}

router.get('/', (req, res) => {
  if (!req.session?.authed) return res.redirect('/login');
  return res.redirect('/wizard');
});

router.get('/logo.jpg', (req, res) => {
  // Try to find the logo in the workspace first, similar to original logic
  const guessed = path.resolve('/root/.openclaw/workspace/openclaw-model-gui/web/public/logo.jpg');
  if (fs.existsSync(guessed)) return res.sendFile(guessed);
  res.status(404).send('logo not found');
});

router.get('/login', (req, res) => {
  res.send(renderLogin());
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).send(renderLayout({
      title: `${APP_NAME} - Error`,
      body: '<div class="alert error">ADMIN_PASSWORD_HASH missing in .env</div>'
    }));
  }

  const ok = username === ADMIN_USER && await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH);
  if (!ok) {
    return res.status(401).send(renderLogin({ error: 'Invalid username or password.' }));
  }

  req.session.authed = true;
  res.redirect('/wizard');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/wizard', isAuthed, async (req, res) => {
  try {
    let backups = [];
    if (fs.existsSync(BACKUP_DIR)) {
      backups = (await fsp.readdir(BACKUP_DIR)).filter(f => f.endsWith('.zip')).sort().reverse();
    }
    const status = req.query.ok ? decodeURIComponent(req.query.ok) : '';
    res.send(renderWizard({ backups, status }));
  } catch (err) {
    res.status(500).send(renderError('Wizard Error', err));
  }
});

router.post('/backup', isAuthed, async (req, res) => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `openclaw-backup-${stamp}.zip`);

    await createBackupZip(backupFile);

    res.redirect(`/wizard?ok=${encodeURIComponent(`Backup created: ${path.basename(backupFile)}`)}`);
  } catch (err) {
    res.status(500).send(renderError('Backup Failed', err));
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
    return res.status(500).send(renderError('Delete Failed', err));
  }
});

router.post('/restore', isAuthed, upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No backup uploaded');
    if (req.body.confirm !== 'yes') throw new Error('Confirmation required');

    await restoreBackup(req.file.path);
    await removePath(req.file.path);

    res.redirect(`/wizard?ok=${encodeURIComponent('Restore completed. A pre-restore backup was created automatically.')}`);
  } catch (err) {
    res.status(500).send(renderError('Restore Failed', err));
  }
});

module.exports = router;
