# OpenClaw Backup Wizard

A login-protected web app to backup and restore your OpenClaw config/state with a simple wizard UI.

## Features

- Login screen (single admin user from `.env`)
- Branded header with logo
- One-click backup to ZIP
- Restore from ZIP
- Automatic **pre-restore emergency backup**
- Download previous backups

## What gets backed up

- `~/.openclaw` (full OpenClaw state)
- Workspace config/memory files:
  - `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `IDENTITY.md`, `HEARTBEAT.md`, `MEMORY.md`
  - `memory/` directory

## Setup

```bash
cd openclaw-backup-wizard
npm install
cp .env.example .env
```

Generate password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-strong-password',10))"
```

Put the hash in `.env` as `ADMIN_PASSWORD_HASH`.

## Run

```bash
npm start
```

Open: `http://127.0.0.1:4280`

## Notes

- Restores overwrite current files.
- The app creates `pre-restore-*.zip` before every restore.
- If you want to change logo, set `LOGO_PATH` in `.env` and serve file via `/static` or adjust route.
