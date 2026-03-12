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

// When running from `src/config.js`, `import.meta.dirname` will be the `src` folder, so we need to go up one directory for the project root.
const projectRoot = path.join(import.meta.dirname, '..');

export const BACKUP_DIR = path.join(projectRoot, 'backups');
export const RUNTIME_DIR = path.join(projectRoot, '.runtime');
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
