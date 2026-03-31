import 'dotenv/config.js'; // Load .env file before other imports
import fs from 'fs';
import app from './src/app.js';
import { APP_NAME, PORT, BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR } from './src/config.js';

for (const p of [BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
