import path from 'path';
import fs from 'fs';
import 'dotenv/config';

export const PORT = Number(process.env.PORT || 4280);
export const APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
export const ADMIN_USER = process.env.ADMIN_USER || 'admin';
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
export const LOGO_PATH = process.env.LOGO_PATH || '/static/logo.jpg';

export const HOME_DIR = process.env.HOME || '/root';
export const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw');
export const WORKSPACE_DIR = '/root/.openclaw/workspace';

// Since we are moving to src/config.js, the project root is import.meta.dirname/..
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

export const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups');
export const RUNTIME_DIR = path.join(PROJECT_ROOT, '.runtime');
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

for (const p of [BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}
