import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { BACKUP_DIR, UPLOAD_DIR, APP_NAME } from '../config.js';
import { createBackupZip } from '../services/backupService.js';
import { restoreBackup } from '../services/restoreService.js';
import { isAuthed } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: UPLOAD_DIR });

router.use(isAuthed);

router.get('/wizard', async (req, res, next) => {
  try {
    let backups = [];
    if (fs.existsSync(BACKUP_DIR)) {
      const files = await fs.promises.readdir(BACKUP_DIR);
      backups = files.filter(f => f.endsWith('.zip')).sort().reverse();
    }
    res.render('wizard', { title: `${APP_NAME} - Wizard`, backups, status: req.query.ok, error: req.query.error });
  } catch (err) {
    next(err);
  }
});

router.post('/backup', async (req, res, next) => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `openclaw-backup-${stamp}.zip`);

    // Ensure BACKUP_DIR exists
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true });

    await createBackupZip(backupFile);
    res.redirect(`/wizard?ok=${encodeURIComponent(`Backup created: ${path.basename(backupFile)}`)}`);
  } catch (err) {
    next(err);
  }
});

router.post('/restore', upload.single('backup'), async (req, res, next) => {
  try {
    if (!req.file) throw new Error('No backup uploaded');
    if (req.body.confirm !== 'yes') throw new Error('Confirmation required');

    // Create pre-restore backup
    const preRestoreFile = path.join(BACKUP_DIR, `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`);
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
    await createBackupZip(preRestoreFile);

    await restoreBackup(req.file.path);

    // Cleanup uploaded file
    await fs.promises.rm(req.file.path, { force: true });

    res.redirect(`/wizard?ok=${encodeURIComponent('Restore completed. A pre-restore backup was created automatically.')}`);
  } catch (err) {
    // Cleanup uploaded file on error
    if (req.file?.path) await fs.promises.rm(req.file.path, { force: true });
    next(err);
  }
});

router.get('/download/:name', async (req, res, next) => {
  try {
    const target = path.basename(req.params.name);
    const file = path.join(BACKUP_DIR, target);
    // Prevent directory traversal
    if (target !== req.params.name || !fs.existsSync(file)) {
      return res.status(404).send('Not found');
    }
    res.download(file);
  } catch (err) {
    next(err);
  }
});

router.post('/delete-backup', async (req, res, next) => {
  try {
    const target = path.basename(String(req.body?.name || ''));
    if (!target.endsWith('.zip')) {
      return res.redirect(`/wizard?error=${encodeURIComponent('Invalid backup name.')}`);
    }

    const file = path.join(BACKUP_DIR, target);
    if (!fs.existsSync(file)) {
      return res.redirect(`/wizard?error=${encodeURIComponent('Backup not found.')}`);
    }

    await fs.promises.unlink(file);
    return res.redirect(`/wizard?ok=${encodeURIComponent(`Backup deleted: ${target}`)}`);
  } catch (err) {
    next(err);
  }
});

export default router;
