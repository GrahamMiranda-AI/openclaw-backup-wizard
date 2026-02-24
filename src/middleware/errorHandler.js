export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (res.headersSent) {
    return next(err);
  }

  if (req.accepts('html')) {
    return res.status(status).render('error', { title: 'Error', message, error: process.env.NODE_ENV === 'development' ? err : {} });
  }
  return res.status(status).json({ error: message });
}
