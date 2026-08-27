import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import { pool } from '../db.js';

const JWT_SECRET  = process.env.JWT_SECRET  || 'shasthi-jwt-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function userView(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    const user  = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: userView(user) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'An account with this email already exists' });
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const result = await pool.query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.password_hash) {
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please use the Google button.' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)  return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken(user);
    res.json({ token, user: userView(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (requireAuth)
export async function me(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'User not found' });
    res.json(userView(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/google
// Verifies Google access_token by calling Google's userinfo endpoint
export async function googleAuth(req, res, next) {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ message: 'access_token is required' });
    }

    // Verify with Google's userinfo endpoint
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Invalid Google token. Please sign in again.' });
    }

    const { sub: googleId, email, name, email_verified } = await googleRes.json();

    if (!email_verified) {
      return res.status(403).json({ message: 'Google account email is not verified.' });
    }

    // Find existing user by email
    let result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let user;
    if (result.rowCount > 0) {
      user = result.rows[0];
      // Link google_id if not already set
      await pool.query(
        `UPDATE users SET google_id = COALESCE(google_id, $1) WHERE id = $2`,
        [googleId, user.id]
      );
    } else {
      // Create new Google account (no password_hash)
      result = await pool.query(
        `INSERT INTO users (name, email, google_id, password_hash)
         VALUES ($1, $2, $3, NULL)
         RETURNING id, name, email, created_at`,
        [name, email.toLowerCase(), googleId]
      );
      user = result.rows[0];
    }

    const token = signToken(user);
    res.json({ token, user: userView(user) });
  } catch (err) {
    console.error('Google auth error:', err.message);
    next(err);
  }
}
