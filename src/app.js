import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

import { PORT, SESSION_SECRET, LOGO_PATH } from './config.js';
import authRoutes from './routes/auth.js';
import wizardRoutes from './routes/wizard.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:"],
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.locals.APP_NAME = process.env.APP_NAME || 'OpenClaw Backup Wizard';
  res.locals.LOGO_PATH = process.env.LOGO_PATH || '/static/logo.jpg';
  next();
});
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Static files
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/', authRoutes);
app.use('/', wizardRoutes);

app.get('/', (req, res) => {
  res.redirect('/wizard');
});

// Logo route
app.get('/logo.jpg', (req, res) => {
   const guessed = path.join(process.env.HOME || '/root', '.openclaw/workspace/openclaw-model-gui/web/public/logo.jpg');
   if (fs.existsSync(guessed)) return res.sendFile(guessed);
   res.redirect('/static/logo.jpg');
});

// 404
app.use((req, res, next) => {
  res.status(404).render('error', { title: '404 - Not Found', message: 'Page not found', error: {} });
});

// Error Handler
app.use(errorHandler);

export default app;
