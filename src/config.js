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

// Use import.meta.dirname instead of __dirname in ESM, and construct absolute paths from root.
// Our config file is in `src/`, so import.meta.dirname is `<project_root>/src`. We need to use
// `..` or build paths relative to `path.join(import.meta.dirname, '..')` to stay backwards compatible
// with where these folders were generated. Or we can just build relative to `import.meta.dirname, '..'`.
const __dirname = path.join(import.meta.dirname, '..');

export const BACKUP_DIR = path.join(__dirname, 'backups');
export const RUNTIME_DIR = path.join(__dirname, '.runtime');
export const UPLOAD_DIR = path.join(RUNTIME_DIR, 'uploads');
export const TMP_RESTORE_DIR = path.join(RUNTIME_DIR, 'restore');
export const PUBLIC_DIR = path.join(__dirname, 'public');

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
