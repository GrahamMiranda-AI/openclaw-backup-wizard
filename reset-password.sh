#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  cp .env.example .env
fi

NEW_PASS="${1:-$(openssl rand -base64 18 | tr -d '\n' | cut -c1-20)}"
HASH=$(node --input-type=commonjs -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" "$NEW_PASS")

if grep -q '^ADMIN_PASSWORD_HASH=' "$ENV_FILE"; then
  sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=${HASH}|" "$ENV_FILE"
else
  echo "ADMIN_PASSWORD_HASH=${HASH}" >> "$ENV_FILE"
fi

echo "Password reset complete"
echo "Username: ${ADMIN_USER:-admin}"
echo "Password: ${NEW_PASS}"
