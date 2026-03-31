import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';

import { SESSION_SECRET } from './config.js';
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

app.use('/static', express.static(path.join(import.meta.dirname, '..', 'public')));

app.use('/', router);

export default app;
