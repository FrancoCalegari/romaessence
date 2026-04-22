/**
 * Middleware to protect admin routes.
 * Redirects to login if not authenticated.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
}

module.exports = { requireAuth };
