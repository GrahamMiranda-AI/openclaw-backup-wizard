import fs from 'fs';
import path from 'path';
import * as url from 'url';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

import {
  SESSION_SECRET,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './config.js';
import router from './routes.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express();

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

const ROOT_DIR = path.join(__dirname, '..');
app.use('/static', express.static(path.join(ROOT_DIR, 'public')));

app.use('/', router);

export { app };
