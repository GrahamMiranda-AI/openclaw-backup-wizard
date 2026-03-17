import express from 'express';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import { PORT, APP_NAME, SESSION_SECRET, UPLOAD_DIR } from './src/config.js';
import setupRoutes from './src/routes.js';

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

app.use('/static', express.static(path.join(import.meta.dirname, 'public')));

const upload = multer({ dest: UPLOAD_DIR });

setupRoutes(app, upload);

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
