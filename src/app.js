import express from 'express';
import fs from 'fs';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { SESSION_SECRET, BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR } from './config.js';
import routes from './routes.js';

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

// Resolve the path to the public directory relative to this file
app.use('/static', express.static(path.join(import.meta.dirname, '../public')));

app.use(routes);

export { app };
