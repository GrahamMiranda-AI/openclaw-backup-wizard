# OpenClaw Backup Wizard

<p align="center">
  <img src="public/logo.jpg" alt="OpenClaw Backup Wizard Logo" width="110" />
</p>

A login-protected web app to backup and restore your OpenClaw config/state with a clean wizard UI.

## Features

- Login screen (single admin user from `.env`)
- Branded header with logo
- Modern UI with **Light mode + Dark mode** toggle
- One-click backup to ZIP
- Restore from ZIP
- Automatic **pre-restore emergency backup**
- Download previous backups
- Simple password reset command that prints the new password
- Footer website link: `https://www.grahammiranda.com/`

## What gets backed up

- `~/.openclaw` (filtered to important state/config)
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

## Password reset (easy)

Generate and print a new password:

```bash
npm run reset-password
```

Set a specific password:

```bash
./reset-password.sh "MyNewStrongPass123!"
```

## Branding

- Default logo path: `LOGO_PATH=/static/logo.jpg`
- Replace `public/logo.jpg` with your logo if needed.

## Notes

- Restores overwrite current files.
- The app creates `pre-restore-*.zip` before every restore.
