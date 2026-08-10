#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  cp .env.example .env
fi

NEW_PASS="${1:-$(openssl rand -base64 18 | tr -d '\n' | cut -c1-20)}"

# Use ESM dynamic import securely passing password via environment variable
export NEW_PASS
HASH=$(node --input-type=module -e "
  const { default: bcrypt } = await import('bcryptjs');
  console.log(bcrypt.hashSync(process.env.NEW_PASS, 10));
")

if grep -q '^ADMIN_PASSWORD_HASH=' "$ENV_FILE"; then
  sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=${HASH}|" "$ENV_FILE"
else
  echo "ADMIN_PASSWORD_HASH=${HASH}" >> "$ENV_FILE"
fi

echo "Password reset complete"
echo "Username: ${ADMIN_USER:-admin}"
echo "Password: ${NEW_PASS}"
