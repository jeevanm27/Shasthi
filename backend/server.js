import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 8080);
const adminKey = process.env.ADMIN_KEY || "shasthi-admin";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const seedProducts = [
  ["turmeric-powder", "Turmeric Powder", "Powders", 95, "200 g", "Everyday essential", true, "Golden, aromatic turmeric for daily cooking."],
  ["sambar-powder", "Sambar Powder", "Blends", 120, "200 g", "Best seller", true, "A balanced South Indian spice blend."],
  ["rasam-powder", "Rasam Powder", "Blends", 110, "150 g", "Family favourite", true, "Peppery, fragrant blend for comforting rasam."],
  ["idli-podi", "Idli Podi", "Podis", 135, "200 g", "New", true, "Roasted lentil and chilli condiment powder."],
  ["mango-thokku", "Mango Thokku", "Pickles", 150, "250 g", "Seasonal", false, "Tangy mango relish made in small batches."]
];

app.use(cors());
app.use(express.json({ limit: "32kb" }));

function requireAdmin(req, res, next) {
  if (req.get("X-Admin-Key") !== adminKey) return res.status(401).json({ message: "Administrator access required" });
  next();
}
function productFromRow(row) { return { ...row, price: Number(row.price) }; }
function validateProduct(body, partial = false) {
  const { name, category, price, weight } = body;
  if (!partial && (!name || !category || !weight || !Number.isFinite(Number(price)) || Number(price) <= 0)) return "name, category, positive price, and weight are required";
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) return "price must be positive";
  return null;
}

app.get("/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ status: "ok", service: "catalog-service" }); }
  catch { res.status(503).json({ status: "unavailable", service: "catalog-service" }); }
});
app.get("/api/products", async (req, res, next) => {
  try {
    const values = [], clauses = [];
    if (req.query.category) { values.push(String(req.query.category).toLowerCase()); clauses.push(`LOWER(category) = $${values.length}`); }
    if (req.query.q) { values.push(`%${String(req.query.q)}%`); clauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`); }
    const result = await pool.query(`SELECT id, name, category, price, weight, tag, available, description FROM products ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY name`, values);
    res.json(result.rows.map(productFromRow));
  } catch (error) { next(error); }
});
app.get("/api/products/:id", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, category, price, weight, tag, available, description FROM products WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Product not found" });
    res.json(productFromRow(result.rows[0]));
  } catch (error) { next(error); }
});
app.post("/api/products", requireAdmin, async (req, res, next) => {
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const { name, category, price, weight, description = "", tag = "New", available = true } = req.body;
  const id = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  try {
    const result = await pool.query("INSERT INTO products (id, name, category, price, weight, tag, available, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [id, String(name).trim(), String(category).trim(), Number(price), String(weight).trim(), String(tag).trim(), Boolean(available), String(description).trim()]);
    res.status(201).json(productFromRow(result.rows[0]));
  } catch (error) { if (error.code === "23505") return res.status(409).json({ message: "A product with this name already exists" }); next(error); }
});
app.put("/api/products/:id", requireAdmin, async (req, res, next) => {
  const validationError = validateProduct(req.body, true);
  if (validationError) return res.status(400).json({ message: validationError });
  const fields = ["name", "category", "price", "weight", "tag", "available", "description"].filter(field => req.body[field] !== undefined);
  if (!fields.length) return res.status(400).json({ message: "Provide at least one field to update" });
  const values = fields.map(field => field === "price" ? Number(req.body[field]) : field === "available" ? Boolean(req.body[field]) : String(req.body[field]).trim());
  try {
    const result = await pool.query(`UPDATE products SET ${fields.map((field, index) => `${field} = $${index + 1}`).join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`, [...values, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Product not found" });
    res.json(productFromRow(result.rows[0]));
  } catch (error) { next(error); }
});
app.delete("/api/products/:id", requireAdmin, async (req, res, next) => {
  try { const result = await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]); if (!result.rowCount) return res.status(404).json({ message: "Product not found" }); res.status(204).end(); }
  catch (error) { next(error); }
});
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: "Unexpected catalog service error" }); });

async function initialiseDatabase() {
  await pool.query("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price NUMERIC(10,2) NOT NULL CHECK (price > 0), weight TEXT NOT NULL, tag TEXT NOT NULL DEFAULT 'New', available BOOLEAN NOT NULL DEFAULT TRUE, description TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  for (const product of seedProducts) await pool.query("INSERT INTO products (id, name, category, price, weight, tag, available, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING", product);
}
initialiseDatabase().then(() => app.listen(port, () => console.log(`catalog-service listening on ${port}`))).catch(error => { console.error("Could not initialise catalog database", error); process.exit(1); });
