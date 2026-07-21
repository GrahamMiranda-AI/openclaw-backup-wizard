import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import {
  SESSION_SECRET,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './config.js';
import router from './routes.js';

for (const p of [BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

export const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

const publicPath = path.join(import.meta.dirname, '../public');
app.use('/static', express.static(publicPath));

app.use(router);
