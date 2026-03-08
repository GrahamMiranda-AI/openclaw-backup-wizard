import path from 'path';

export const PORT = Number(process.env.PORT || 4280);
export const APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
export const ADMIN_USER = process.env.ADMIN_USER || 'admin';
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
export const LOGO_PATH = process.env.LOGO_PATH || '/static/logo.jpg';

export const HOME_DIR = process.env.HOME || '/root';
export const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');
export const WORKSPACE_DIR = '/root/.openclaw/workspace';

// Use import.meta.dirname instead of __dirname
const __dirname = import.meta.dirname;

// Assuming server.js is in the root, and this file is in src/, so we go up one level
const ROOT_DIR = path.join(__dirname, '..');

export const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
export const RUNTIME_DIR = path.join(ROOT_DIR, '.runtime');
export const UPLOAD_DIR = path.join(RUNTIME_DIR, 'uploads');
export const TMP_RESTORE_DIR = path.join(RUNTIME_DIR, 'restore');

export const WORKSPACE_FILES = [
  'AGENTS.md',
  'SOUL.md',
  'USER.md',
  'TOOLS.md',
  'IDENTITY.md',
  'HEARTBEAT.md',
  'MEMORY.md',
  'memory'
];
