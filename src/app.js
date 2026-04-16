import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import {
  SESSION_SECRET,
  STATIC_DIR,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './config.js';
import { router } from './routes.js';

export const app = express();

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

app.use('/static', express.static(STATIC_DIR));

app.use('/', router);
