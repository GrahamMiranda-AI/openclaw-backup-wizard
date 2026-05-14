import 'dotenv/config.js';
import fs from 'fs';

// Force directories to be created from config.js before anything starts
import * as config from './src/config.js';

for (const p of [config.BACKUP_DIR, config.RUNTIME_DIR, config.UPLOAD_DIR, config.TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

import { app } from './src/app.js';

app.listen(config.PORT, () => {
  console.log(`${config.APP_NAME} running on http://127.0.0.1:${config.PORT}`);
});
