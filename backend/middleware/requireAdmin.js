const adminKey = process.env.ADMIN_KEY || 'shasthi-admin';

export function requireAdmin(req, res, next) {
  if (req.get('X-Admin-Key') !== adminKey) {
    return res.status(401).json({ message: 'Administrator access required' });
  }
  next();
}
