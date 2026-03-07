import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { PORT, SESSION_SECRET, APP_NAME, ensureDirectories } from './src/config.js';
import { setupRoutes } from './src/routes.js';

const app = express();
const __dirname = import.meta.dirname;

ensureDirectories();

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

setupRoutes(app);

export const server = app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
