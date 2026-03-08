import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { router } from './src/routes.js';
import {
  PORT,
  APP_NAME,
  SESSION_SECRET,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './src/config.js';

const app = express();

const __dirname = import.meta.dirname;

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

app.use('/static', express.static(path.join(__dirname, 'public')));

app.use('/', router);

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
