import { pool } from '../db.js';

function productFromRow(row) { return { ...row, price: Number(row.price) }; }

function validateProduct(body, partial = false) {
  const { name, category, price, weight } = body;
  if (!partial && (!name || !category || !weight || !Number.isFinite(Number(price)) || Number(price) <= 0)) {
    return 'name, category, positive price, and weight are required';
  }
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) {
    return 'price must be positive';
  }
  return null;
}

const SELECT_COLS = 'id, name, category, price, weight, tag, available, description, image_url';


export async function listProducts(req, res, next) {
  try {
    const values = [], clauses = [];
    if (req.query.category) {
      values.push(String(req.query.category).toLowerCase());
      clauses.push(`LOWER(category) = $${values.length}`);
    }
    if (req.query.q) {
      values.push(`%${String(req.query.q)}%`);
      clauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT ${SELECT_COLS} FROM products ${where} ORDER BY name`,
      values
    );
    res.json(result.rows.map(productFromRow));
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${SELECT_COLS} FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Product not found' });
    res.json(productFromRow(result.rows[0]));
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  const err = validateProduct(req.body);
  if (err) return res.status(400).json({ message: err });
  const { name, category, price, weight, description = '', tag = 'New', available = true } = req.body;
  const id = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = await pool.query(
      `INSERT INTO products (id, name, category, price, weight, tag, available, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, String(name).trim(), String(category).trim(), Number(price), String(weight).trim(),
       String(tag).trim(), Boolean(available), String(description).trim()]
    );
    res.status(201).json(productFromRow(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'A product with this name already exists' });
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  const err = validateProduct(req.body, true);
  if (err) return res.status(400).json({ message: err });
  const fields = ['name','category','price','weight','tag','available','description']
    .filter(f => req.body[f] !== undefined);
  if (!fields.length) return res.status(400).json({ message: 'Provide at least one field to update' });
  const values = fields.map(f =>
    f === 'price'     ? Number(req.body[f])  :
    f === 'available' ? Boolean(req.body[f]) :
    String(req.body[f]).trim()
  );
  try {
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE products SET ${setClauses}, updated_at = NOW()
       WHERE id = $${values.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Product not found' });
    res.json(productFromRow(result.rows[0]));
  } catch (err) { next(err); }
}

export async function deleteProduct(req, res, next) {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Product not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}
