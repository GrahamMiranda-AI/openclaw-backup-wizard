import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';

import { PORT, SESSION_SECRET, APP_NAME } from './src/config.js';
import routes from './src/routes.js';

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

const PROJECT_ROOT = import.meta.dirname;
app.use('/static', express.static(path.join(PROJECT_ROOT, 'public')));

app.use('/', routes);

// Export the app for testing
export { app };

// Start the server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
  });
}
