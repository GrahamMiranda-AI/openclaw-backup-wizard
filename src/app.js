import express from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import cookieParserPkg from 'cookie-parser';
import multerPkg from 'multer';

const cookieParser = cookieParserPkg.default || cookieParserPkg;
const multer = multerPkg.default || multerPkg;

import {
  SESSION_SECRET,
  BACKUP_DIR,
  RUNTIME_DIR,
  UPLOAD_DIR,
  TMP_RESTORE_DIR
} from './config.js';

import { setupRoutes } from './routes.js';

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

// Use import.meta.dirname instead of __dirname
app.use('/static', express.static(path.join(import.meta.dirname, '../public')));

export const upload = multer({ dest: UPLOAD_DIR });

setupRoutes(app);

export { app };
