require('dotenv').config();
const path = require('path');

const APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const LOGO_PATH = process.env.LOGO_PATH || '/static/logo.jpg';
const PORT = Number(process.env.PORT || 4280);

const HOME_DIR = process.env.HOME || '/root';
const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');
const WORKSPACE_DIR = '/root/.openclaw/workspace';
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const RUNTIME_DIR = path.join(process.cwd(), '.runtime');
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

module.exports = {
  APP_NAME,
  SESSION_SECRET,
  ADMIN_USER,
  ADMIN_PASSWORD_HASH,
  LOGO_PATH,
  PORT,
  OPENCLAW_DIR,
  WORKSPACE_DIR,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR,
  WORKSPACE_FILES
};
