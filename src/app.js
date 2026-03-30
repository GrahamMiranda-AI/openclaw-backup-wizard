import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';

import { SESSION_SECRET, UPLOAD_DIR } from './config.js';
import router from './routes.js';

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

const projectRoot = path.resolve(import.meta.dirname, '..');
app.use('/static', express.static(path.join(projectRoot, 'public')));

app.use('/', router);

export default app;
