import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shasthi-jwt-secret';

/**
 * Middleware: verify Bearer JWT and attach req.user = { id, email, role }
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
}

/**
 * Middleware factory: ensure req.user has a specific role.
 * Must be chained AFTER requireAuth.
 *
 * Usage:  router.delete('/...', requireAuth, requireRole('ADMIN'), handler)
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: `Forbidden: requires ${role} role` });
    }
    next();
  };
}
