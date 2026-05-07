import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import createRouter from './routes.js';
import { SESSION_SECRET, UPLOAD_DIR } from './config.js';

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

const staticPath = path.join(import.meta.dirname, '..', 'public');
app.use('/static', express.static(staticPath));

const upload = multer({ dest: UPLOAD_DIR });

app.use('/', createRouter(upload));
