import express from "express";
import cors from "cors";

const app = express();
const port = Number(process.env.PORT || 8080);
const adminKey = process.env.ADMIN_KEY || "shasthi-admin";

const products = [
  { id: "turmeric-powder", name: "Turmeric Powder", category: "Powders", price: 95, weight: "200 g", tag: "Everyday essential", available: true, description: "Golden, aromatic turmeric for daily cooking." },
  { id: "sambar-powder", name: "Sambar Powder", category: "Blends", price: 120, weight: "200 g", tag: "Best seller", available: true, description: "A balanced South Indian spice blend." },
  { id: "rasam-powder", name: "Rasam Powder", category: "Blends", price: 110, weight: "150 g", tag: "Family favourite", available: true, description: "Peppery, fragrant blend for comforting rasam." },
  { id: "idli-podi", name: "Idli Podi", category: "Podis", price: 135, weight: "200 g", tag: "New", available: true, description: "Roasted lentil and chilli condiment powder." },
  { id: "mango-thokku", name: "Mango Thokku", category: "Pickles", price: 150, weight: "250 g", tag: "Seasonal", available: false, description: "Tangy mango relish made in small batches." }
];

app.use(cors());
app.use(express.json());

function requireAdmin(req, res, next) {
  if (req.get("X-Admin-Key") !== adminKey) return res.status(401).json({ message: "Administrator access required" });
  next();
}

app.get("/health", (_req, res) => res.json({ status: "ok", service: "catalog-service" }));

app.get("/api/products", (req, res) => {
  const category = req.query.category?.toString().toLowerCase();
  const query = req.query.q?.toString().toLowerCase();
  const result = products.filter((product) =>
    (!category || product.category.toLowerCase() === category) &&
    (!query || `${product.name} ${product.description}`.toLowerCase().includes(query))
  );
  res.json(result);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

app.post("/api/products", requireAdmin, (req, res) => {
  const { name, category, price, weight, description = "", tag = "New" } = req.body;
  if (!name || !category || !weight || !Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ message: "name, category, positive price, and weight are required" });
  }
  const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (products.some((item) => item.id === id)) return res.status(409).json({ message: "A product with this name already exists" });
  const product = { id, name: name.trim(), category: category.trim(), price: Number(price), weight: weight.trim(), description: description.trim(), tag: tag.trim(), available: true };
  products.push(product);
  res.status(201).json(product);
});

app.put("/api/products/:id", requireAdmin, (req, res) => {
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Product not found" });
  const current = products[index];
  const { name, category, price, weight, description, tag, available } = req.body;
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) return res.status(400).json({ message: "price must be positive" });
  const updated = {
    ...current,
    ...(name !== undefined && { name: String(name).trim() }),
    ...(category !== undefined && { category: String(category).trim() }),
    ...(price !== undefined && { price: Number(price) }),
    ...(weight !== undefined && { weight: String(weight).trim() }),
    ...(description !== undefined && { description: String(description).trim() }),
    ...(tag !== undefined && { tag: String(tag).trim() }),
    ...(available !== undefined && { available: Boolean(available) })
  };
  if (!updated.name || !updated.category || !updated.weight) return res.status(400).json({ message: "name, category and weight are required" });
  products[index] = updated;
  res.json(updated);
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Product not found" });
  products.splice(index, 1);
  res.status(204).end();
});

app.listen(port, () => console.log(`catalog-service listening on ${port}`));
