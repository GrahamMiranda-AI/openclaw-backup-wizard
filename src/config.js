import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const PORT = Number(process.env.PORT || 4280);
export const APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
export const ADMIN_USER = process.env.ADMIN_USER || 'admin';
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
export const LOGO_PATH = process.env.LOGO_PATH || '/static/logo.jpg';

export const HOME_DIR = process.env.HOME || '/root';
export const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');
export const WORKSPACE_DIR = '/root/.openclaw/workspace';

// In ES modules, __dirname is not available directly, so we use import.meta.dirname
// which is natively available in Node.js v20.11.0 / v21.2.0 and later.
const dirName = import.meta.dirname ? import.meta.dirname : path.dirname(new URL(import.meta.url).pathname);
const parentDir = path.join(dirName, '..');

export const BACKUP_DIR = path.join(parentDir, 'backups');
export const RUNTIME_DIR = path.join(parentDir, '.runtime');
export const UPLOAD_DIR = path.join(RUNTIME_DIR, 'uploads');
export const TMP_RESTORE_DIR = path.join(RUNTIME_DIR, 'restore');
export const STATIC_DIR = path.join(parentDir, 'public');

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
