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
