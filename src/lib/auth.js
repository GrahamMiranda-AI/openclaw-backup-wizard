import bcrypt from 'bcryptjs';
import { ADMIN_USER, ADMIN_PASSWORD_HASH } from '../config.js';

export function isAuthed(req, res, next) {
  if (req.session?.authed) return next();

  // Return JSON error for API calls if we ever have them, otherwise redirect
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.redirect('/login');
}

export async function verifyLogin(username, password) {
  if (!ADMIN_PASSWORD_HASH) {
    throw new Error('ADMIN_PASSWORD_HASH missing in .env');
  }

  const isValid = username === ADMIN_USER && await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH);
  return isValid;
}
