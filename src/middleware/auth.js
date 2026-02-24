export function isAuthed(req, res, next) {
  if (req.session?.authed) return next();
  if (req.accepts('html')) {
    return res.redirect('/login');
  }
  return res.status(401).json({ error: 'Unauthorized' });
}
