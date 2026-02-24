import express from 'express';
import bcrypt from 'bcryptjs';
import { ADMIN_USER, ADMIN_PASSWORD_HASH, APP_NAME } from '../config.js';

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session?.authed) return res.redirect('/wizard');
  res.render('login', { title: `${APP_NAME} - Login` });
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!ADMIN_PASSWORD_HASH) {
      throw new Error('ADMIN_PASSWORD_HASH missing in .env');
    }

    const ok = username === ADMIN_USER && await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH);
    if (!ok) {
      return res.status(401).render('login', { title: `${APP_NAME} - Login`, error: 'Invalid login.' });
    }

    req.session.authed = true;
    res.redirect('/wizard');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

export default router;
