import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import {
  PORT,
  APP_NAME,
  SESSION_SECRET,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './src/config.js';
import router from './src/routes.js';

const app = express();

// Ensure required directories exist
for (const p of [BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

// Setup static files directory. Uses `import.meta.dirname` to get the root dir properly.
app.use('/static', express.static(path.join(import.meta.dirname, 'public')));

// Use routes
app.use('/', router);

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
