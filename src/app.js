import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import {
  SESSION_SECRET,
  PROJECT_ROOT,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './config.js';
import routes from './routes.js';

for (const p of [BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR]) {
  fs.mkdirSync(p, { recursive: true });
}

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

app.use('/static', express.static(path.join(PROJECT_ROOT, 'public')));

app.use('/', routes);

export default app;
