require('dotenv').config();
const path = require('path');
const fs = require('fs');

const PORT = Number(process.env.PORT || 4280);
const APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const LOGO_PATH = process.env.LOGO_PATH || '/static/logo.jpg';

const HOME_DIR = process.env.HOME || '/root';
const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');
const ROOT_DIR = path.resolve(__dirname, '..'); // Assuming src/config.js
const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
const RUNTIME_DIR = path.join(ROOT_DIR, '.runtime');
const UPLOAD_DIR = path.join(RUNTIME_DIR, 'uploads');
const TMP_RESTORE_DIR = path.join(RUNTIME_DIR, 'restore');

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

// Ensure directories exist
for (const p of [BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

module.exports = {
  PORT,
  APP_NAME,
  SESSION_SECRET,
  ADMIN_USER,
  ADMIN_PASSWORD_HASH,
  LOGO_PATH,
  HOME_DIR,
  OPENCLAW_DIR,
  WORKSPACE_DIR,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR,
  WORKSPACE_FILES,
  ROOT_DIR
};
