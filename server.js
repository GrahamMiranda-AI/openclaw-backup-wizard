require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const {
  PORT,
  APP_NAME,
  SESSION_SECRET
} = require('./src/config');

const routes = require('./src/routes');

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

// Serve static assets from public/
app.use('/static', express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
  });
}

module.exports = app; // Export for testing
