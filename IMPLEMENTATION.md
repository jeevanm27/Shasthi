# Shasthi Masala — Full-Stack Restructuring Implementation Plan

> **Purpose:** This document is the single source of truth for the entire re-architecture.
> Start here on every new session. Update task statuses as work progresses.
> Last Updated: 2026-09-12

---

## Quick-Start Checklist (per session)

1. Read this file top-to-bottom.
2. Find the first `[ ]` task in the current phase.
3. Work only on that phase — do not skip ahead.
4. Update task checkboxes as you complete them (`[ ]` to `[x]`).
5. Commit with message: `chore: phase-N - <short description>`.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Target Monorepo Folder Structure](#2-target-monorepo-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Service Responsibility Matrix](#5-service-responsibility-matrix)
6. [Inter-Service Communication Contracts](#6-inter-service-communication-contracts)
7. [Phased Execution Plan](#7-phased-execution-plan)
8. [Key Implementation Notes and Gotchas](#8-key-implementation-notes-and-gotchas)
9. [Running the Stack Locally](#9-running-the-stack-locally)

---

## 1. Architecture Overview

```
Browser
  |
  v
+-------------------------------------+
|         NGINX (API Gateway)         |  Port 3000 (public)
|   Routes by path prefix, serves     |
|   the React SPA for all other paths |
+--------+---------------+------------+
         |               |
    /api/users      /api/catalog
    /api/cart       /api/orders
         |               |
         v               v
+----------------+  +------------------------+
| User & Cart    |  |  Catalog & Search       |
| Service        |  |  Service                |
| (Node.js 22 /  |  |  (Java 21 / Spring Boot)|
|  Express)      |  |                         |
| Port: 4000     |  |  Port: 8080             |
+-------+--------+  +----------+--------------+
        |                      |
        |  Kafka Producer       |  Redis OM Sync (on admin write)
        |  topic: order-created |  Redis FT.SEARCH (on customer read)
        v                      v
+-----------------+     +------------------+
|  Apache Kafka   |     |   Redis Stack     |
|  + Zookeeper    |     |   (RediSearch)    |
+--------+--------+     +------------------+
         |
         |  Kafka Consumer
         v
+---------------------------+
|  Order & Inventory Service |
|  (Java 21 / Spring Boot)  |
|  Port: 8081               |
+-----------+---------------+
            |
            v  (all services share this)
    +----------------+
    |  PostgreSQL 16  |
    |  (source of    |
    |   truth)       |
    +----------------+
```

### What Changed From the Old Architecture

| Old | New | Reason |
|-----|-----|--------|
| `backend/` (Node.js) did everything | Split into **User/Cart** (Node) + **Catalog** (Java) | Separate I/O-heavy from read-heavy workloads |
| No Redis | **Redis Stack** for cart storage and FT search | Sub-millisecond catalog queries |
| Direct HTTP call for orders | **Kafka** event bus (`order-created` topic) | Async, decoupled, resilient |
| No API Gateway | **NGINX** reverse proxy | Single entry point, no CORS issues |
| FastAPI `insights-service` | **Removed** (out of scope for this phase) | Simplify; can be re-added later |
| Frontend directly called backend ports | Frontend calls only `localhost:3000/api/*` | Everything goes through NGINX |

---

## 2. Target Monorepo Folder Structure

```
shasthi/                              <- repo root
|-- IMPLEMENTATION.md                 <- THIS FILE
|-- docker-compose.yml                <- [REWRITE] adds Redis, Kafka, Zookeeper, NGINX
|-- .env.example                      <- [UPDATE] new env vars
|-- nginx/
|   |-- Dockerfile                    <- [NEW] FROM nginx:alpine
|   +-- nginx.conf                    <- [NEW] routing rules
|
|-- user-service/                     <- [RENAME + REWRITE] was backend/
|   |-- Dockerfile
|   |-- package.json
|   |-- server.js                     <- Express entry point
|   |-- db.js                         <- pg pool
|   |-- kafka/
|   |   +-- producer.js               <- [NEW] KafkaJS producer
|   |-- routes/
|   |   |-- auth.js                   <- register / login / me
|   |   |-- cart.js                   <- [NEW] cart CRUD via Redis
|   |   |-- health.js
|   |   +-- user.js                   <- profile / orders-by-user
|   |-- middleware/
|   |   +-- auth.js                   <- JWT verify + RBAC
|   +-- redis/
|       +-- client.js                 <- [NEW] ioredis client
|
|-- catalog-service/                  <- [NEW] Java Spring Boot
|   |-- Dockerfile
|   |-- pom.xml
|   +-- src/main/
|       |-- java/com/shasthi/catalog/
|       |   |-- CatalogApplication.java
|       |   |-- config/
|       |   |   +-- RedisConfig.java
|       |   |-- controller/
|       |   |   +-- ProductController.java  <- GET /api/catalog/products (+ admin CRUD)
|       |   |-- model/
|       |   |   +-- Product.java
|       |   |-- repository/
|       |   |   |-- ProductRepository.java        <- JdbcTemplate (Postgres)
|       |   |   +-- RedisProductRepository.java   <- Redis OM index sync
|       |   +-- service/
|       |       +-- ProductService.java
|       +-- resources/
|           |-- application.yml
|           +-- schema.sql             <- DDL for products + seed data
|
|-- order-service/                    <- [REWRITE] current Spring Boot skeleton
|   |-- Dockerfile
|   |-- pom.xml
|   +-- src/main/
|       |-- java/com/shasthi/order/
|       |   |-- OrderApplication.java
|       |   |-- config/
|       |   |   +-- KafkaConfig.java
|       |   |-- consumer/
|       |   |   +-- OrderCreatedConsumer.java  <- [NEW] Kafka consumer
|       |   |-- controller/
|       |   |   +-- OrderController.java       <- Admin: list orders, update status
|       |   |-- model/
|       |   |   |-- Order.java
|       |   |   +-- OrderItem.java
|       |   |-- repository/
|       |   |   +-- OrderRepository.java       <- JdbcTemplate, atomic inventory deduction
|       |   +-- service/
|       |       +-- OrderService.java
|       +-- resources/
|           |-- application.yml
|           +-- schema.sql             <- DDL for orders + order_items
|
|-- frontend/                         <- [RESTRUCTURE] React + Vite (keep Vite)
|   |-- Dockerfile
|   |-- nginx.conf                    <- SPA fallback for React Router
|   |-- package.json
|   |-- vite.config.js
|   +-- src/
|       |-- main.jsx
|       |-- App.jsx                   <- Root router (customer vs admin)
|       |-- index.css                 <- Global styles / design tokens
|       |-- api/
|       |   |-- auth.js               <- auth API calls
|       |   |-- catalog.js            <- product search/fetch calls
|       |   |-- cart.js               <- cart API calls
|       |   +-- orders.js             <- order API calls
|       |-- context/
|       |   |-- AuthContext.jsx       <- JWT state, role detection
|       |   +-- CartContext.jsx       <- cart state
|       |-- components/
|       |   |-- Navbar.jsx
|       |   |-- ProductCard.jsx
|       |   |-- SearchBar.jsx
|       |   |-- CartDrawer.jsx
|       |   +-- ProtectedRoute.jsx    <- redirects non-admins
|       |-- pages/
|       |   |-- customer/
|       |   |   |-- Home.jsx          <- hero + featured products
|       |   |   |-- Catalog.jsx       <- search + product grid
|       |   |   |-- Cart.jsx
|       |   |   |-- Checkout.jsx      <- 3-step form -> POST /api/cart/checkout
|       |   |   +-- Orders.jsx        <- my order history
|       |   +-- admin/
|       |       |-- AdminLayout.jsx   <- sidebar navigation
|       |       |-- Products.jsx      <- CRUD product table
|       |       +-- Orders.jsx        <- view all + update status
|       +-- hooks/
|           |-- useAuth.js
|           +-- useCart.js
|
+-- docs/
    +-- (keep existing docs)
```

---

## 3. Database Schema

All tables live in **PostgreSQL** (`shasthi` database).  
Schema files are embedded in each service's `resources/schema.sql` and run on startup.

### `users` table — owned by `user-service`
```sql
-- Guard: create ENUM type safely
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role          user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `products` table — owned by `catalog-service`
```sql
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price_per_gram   NUMERIC(10,4) NOT NULL CHECK (price_per_gram > 0),
  stock_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url        TEXT,
  available        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> **Note:** Old `price` + `weight` columns replaced with `price_per_gram` + `stock_quantity` to enable inventory tracking.

### `orders` + `order_items` tables — owned by `order-service`
```sql
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  total_price  NUMERIC(12,2) NOT NULL,
  status       order_status NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL,
  product_name   TEXT NOT NULL,
  quantity_grams INTEGER NOT NULL CHECK (quantity_grams > 0),
  price_locked   NUMERIC(10,4) NOT NULL
);
```

---

## 4. Environment Variables Reference

Copy `.env.example` to `.env` before running locally.

| Variable | Used By | Description | Dev Default |
|---|---|---|---|
| `POSTGRES_PASSWORD` | all | PG password | `shasthi-local` |
| `POSTGRES_DB` | postgres | Database name | `shasthi` |
| `POSTGRES_USER` | postgres | DB user | `shasthi` |
| `JWT_SECRET` | user-service, catalog-service, order-service | Signing secret for JWTs (SHARED) | `shasthi-jwt-secret` |
| `JWT_EXPIRES_IN` | user-service | Token TTL | `7d` |
| `ADMIN_KEY` | user-service | Header to grant ADMIN role on register | `shasthi-admin-2024` |
| `REDIS_URL` | user-service, catalog-service | Redis connection URL | `redis://redis:6379` |
| `KAFKA_BROKERS` | user-service, order-service | Broker list (comma-separated) | `kafka:9092` |
| `KAFKA_CLIENT_ID` | user-service | Kafka client identifier | `user-service` |
| `KAFKA_GROUP_ID` | order-service | Kafka consumer group | `order-service-group` |
| `PORT` | user-service | Node server port | `4000` |

---

## 5. Service Responsibility Matrix

| Concern | user-service (Node) | catalog-service (Java) | order-service (Java) | NGINX |
|---|---|---|---|---|
| Register / Login | YES | NO | NO | routes `/api/users` |
| JWT Issuance | YES | NO | NO | — |
| JWT Verification | YES (middleware) | local verify (shared secret) | local verify (shared secret) | — |
| Cart CRUD | YES (Redis Hash) | NO | NO | routes `/api/cart` |
| Checkout to Kafka emit | YES | NO | NO | routes `/api/cart/checkout` |
| Product CRUD (Admin) | NO | YES (Postgres write + Redis sync) | NO | routes `/api/catalog` |
| Product Search (Customer) | NO | YES (Redis FT.SEARCH) | NO | routes `/api/catalog` |
| Consume `order-created` | NO | NO | YES (Kafka consumer) | — |
| Inventory Deduction | NO | NO | YES (atomic SQL) | — |
| Order Status Update (Admin) | NO | NO | YES | routes `/api/orders` |
| Serve React SPA | NO | NO | NO | YES (static files) |

---

## 6. Inter-Service Communication Contracts

### 6a. Kafka Topic: `order-created`

**Producer:** `user-service` (on `POST /api/cart/checkout`)  
**Consumer:** `order-service`

```json
{
  "eventId":   "uuid-v4",
  "userId":    "uuid",
  "userEmail": "customer@example.com",
  "items": [
    {
      "productId":     "uuid",
      "productName":   "Turmeric Powder",
      "quantityGrams": 200,
      "pricePerGram":  0.4750
    }
  ],
  "totalPrice": 95.00,
  "createdAt":  "ISO-8601 timestamp"
}
```

**On Consume — Order Service must:**
1. Begin a DB transaction.
2. For each item: `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`
3. If rows affected == 0: rollback and mark event as failed (log + dead-letter).
4. Insert into `orders` + `order_items`.
5. Commit.

### 6b. Redis Cart Key Convention

- **Key:** `cart:{userId}` (Redis Hash)
- **Field:** `{productId}`
- **Value:** JSON string `{ "productId", "name", "pricePerGram", "quantityGrams", "imageUrl" }`
- **TTL:** 7 days (reset on every cart update)

### 6c. Redis Search Index (RediSearch)

- **Index name:** `idx:products`
- **Key prefix:** `product:{id}`
- **Indexed fields:** `name` (TEXT, weight 2.0), `category` (TAG), `description` (TEXT), `available` (TAG)
- **Sync trigger:** Every Admin create/update/delete on a product in Postgres

---

## 7. Phased Execution Plan

> Legend: `[ ]` TODO | `[/]` In Progress | `[x]` Done | `[-]` Skipped

---

### PHASE 0: Cleanup and Scaffold
> **Goal:** Delete dead code, rename directories, create new service skeletons.
> **Estimated effort:** 1 session

- [ ] **0.1** Delete `insights-service/` directory entirely
- [ ] **0.2** Rename `backend/` to `user-service/` (git mv to preserve history)
- [ ] **0.3** Create empty `catalog-service/` directory with placeholder `pom.xml`
- [ ] **0.4** Create empty `nginx/` directory with placeholder files
- [ ] **0.5** Update `.gitignore` for new service paths
- [ ] **0.6** Update `.env.example` with all variables from Section 4
- [ ] **0.7** Commit: `chore: phase-0 - cleanup and scaffold new structure`

---

### PHASE 1: Infrastructure (docker-compose + NGINX)
> **Goal:** Spin up all infra locally with `docker compose up`.
> **Estimated effort:** 1 session

- [ ] **1.1** Rewrite `docker-compose.yml`:
  - [ ] Keep `postgres:16-alpine` (same config)
  - [ ] Add `redis/redis-stack:latest` with ports `6379` and `8001` (RedisInsight UI)
  - [ ] Add `zookeeper` (`confluentinc/cp-zookeeper:7.6.0`)
  - [ ] Add `kafka` (`confluentinc/cp-kafka:7.6.0`) depends on zookeeper, expose `9092`
  - [ ] Add `nginx` service (build from `./nginx`) expose `3000:80`
  - [ ] Add `user-service` (build from `./user-service`) port `4000`, depends on postgres + redis + kafka
  - [ ] Add `catalog-service` (build from `./catalog-service`) port `8080`, depends on postgres + redis
  - [ ] Update `order-service` port `8081`, depends on postgres + kafka
  - [ ] Add named volumes: `postgres_data`, `redis_data`
  - [ ] Add healthchecks to redis and kafka services
- [ ] **1.2** Create `nginx/nginx.conf`:
  - [ ] `upstream user_service { server user-service:4000; }`
  - [ ] `upstream catalog_service { server catalog-service:8080; }`
  - [ ] `upstream order_service { server order-service:8081; }`
  - [ ] Route `/api/users/` to `user_service`
  - [ ] Route `/api/cart/` to `user_service`
  - [ ] Route `/api/catalog/` to `catalog_service`
  - [ ] Route `/api/orders/` to `order_service`
  - [ ] Fallback: serve React SPA with `try_files $uri /index.html`
- [ ] **1.3** Create `nginx/Dockerfile` (FROM nginx:alpine, copy conf and static files)
- [ ] **1.4** Test: `docker compose up postgres redis kafka` — verify all healthy
- [ ] **1.5** Commit: `feat: phase-1 - docker-compose + NGINX gateway`

---

### PHASE 2: User and Cart Service (Node.js)
> **Goal:** Fully working auth + cart + checkout -> Kafka emit.
> **Estimated effort:** 1-2 sessions

#### 2a — Auth (migrate from old `backend/`)
- [ ] **2.1** Update `user-service/package.json`: add `kafkajs`, `ioredis`; remove `razorpay`, `google-auth-library`
- [ ] **2.2** Rewrite DB schema in `server.js` — use new `users` schema (add `role` ENUM column)
- [ ] **2.3** Update `routes/auth.js`:
  - [ ] `POST /api/users/register` — hash password, insert, return JWT (ADMIN if `x-admin-key` header matches)
  - [ ] `POST /api/users/login` — verify password, return JWT with `{ id, email, role }` payload
  - [ ] `GET /api/users/me` — protected, return user profile
- [ ] **2.4** Update `middleware/auth.js` — verify JWT, attach `req.user`, add `requireRole('ADMIN')` helper

#### 2b — Redis Cart
- [ ] **2.5** Create `redis/client.js` using `ioredis`, connect to `REDIS_URL`
- [ ] **2.6** Create `routes/cart.js`:
  - [ ] `GET /api/cart` — fetch `cart:{userId}` Hash from Redis
  - [ ] `POST /api/cart/items` — HSET field = productId, value = JSON item; reset TTL 7 days
  - [ ] `PUT /api/cart/items/:productId` — update quantity in Hash
  - [ ] `DELETE /api/cart/items/:productId` — HDEL from Hash
  - [ ] `DELETE /api/cart` — DEL entire `cart:{userId}`
  - [ ] `POST /api/cart/checkout` — read cart, validate, emit Kafka, clear cart, return `{ eventId }`

#### 2c — Kafka Producer
- [ ] **2.7** Create `kafka/producer.js`:
  - [ ] Initialize `KafkaJS` client with `KAFKA_BROKERS`
  - [ ] Export `sendOrderCreated(orderPayload)` function
  - [ ] `producer.send({ topic: 'order-created', messages: [{ key: userId, value: JSON.stringify(payload) }] })`
  - [ ] Connect once on startup, handle disconnect on shutdown
- [ ] **2.8** Wire `kafka/producer.js` into checkout route
- [ ] **2.9** Test auth endpoints with curl/Postman
- [ ] **2.10** Test cart CRUD against Redis
- [ ] **2.11** Test checkout — confirm message in Kafka (`kafka-console-consumer`)
- [ ] **2.12** Commit: `feat: phase-2 - user-service auth + cart + kafka producer`

---

### PHASE 3: Catalog and Search Service (Java Spring Boot)
> **Goal:** Admin product CRUD with Postgres + Redis sync; customer search via RediSearch.
> **Estimated effort:** 2 sessions

#### 3a — Project Setup
- [ ] **3.1** Create `catalog-service/pom.xml` with dependencies:
  - `spring-boot-starter-web`, `spring-boot-starter-jdbc`, `spring-boot-starter-actuator`
  - `spring-boot-starter-validation`, `postgresql` (runtime)
  - `com.redis:redis-om-spring:0.9.x` (for RediSearch entity indexing)
- [ ] **3.2** Create `resources/application.yml` (datasource, redis, server port 8080)
- [ ] **3.3** Create `resources/schema.sql` with `products` DDL + 5 seed products

#### 3b — Product Admin CRUD (Postgres)
- [ ] **3.4** Create `Product.java` model (all fields from schema)
- [ ] **3.5** Create `ProductRepository.java` (JdbcTemplate): `findAll()`, `findById()`, `create()`, `update()`, `delete()`
- [ ] **3.6** Create `ProductController.java`:
  - [ ] `GET /api/catalog/products` — public, list all (paginated)
  - [ ] `GET /api/catalog/products/search?q=` — public, Redis FT.SEARCH
  - [ ] `GET /api/catalog/products/:id` — public
  - [ ] `POST /api/catalog/products` — ADMIN only
  - [ ] `PUT /api/catalog/products/:id` — ADMIN only
  - [ ] `DELETE /api/catalog/products/:id` — ADMIN only

#### 3c — Redis OM Sync (RediSearch)
- [ ] **3.7** Create `RedisConfig.java` — configure `RedisConnectionFactory`, enable `@EnableRedisDocumentRepositories`
- [ ] **3.8** Annotate `Product.java` with `@Document(indexName = "idx:products")`, `@Searchable`, `@Indexed` on relevant fields
- [ ] **3.9** Create `RedisProductRepository.java` extending `RedisDocumentRepository<Product, String>`
- [ ] **3.10** In `ProductService.java`: after every Postgres write, call `redisProductRepository.save(product)` / `.deleteById(id)`
- [ ] **3.11** Implement `searchProducts(String query)` — use Redis OM repository or raw `FT.SEARCH`
- [ ] **3.12** Create `JwtFilter.java` — validate Bearer token using shared `JWT_SECRET`, extract `role` claim, 403 on non-ADMIN for protected routes
- [ ] **3.13** Test CRUD via NGINX on `localhost:3000/api/catalog/products`
- [ ] **3.14** Test search: `GET /api/catalog/products/search?q=turmeric`
- [ ] **3.15** Commit: `feat: phase-3 - catalog-service with redis search sync`

---

### PHASE 4: Order and Inventory Service (Java Spring Boot)
> **Goal:** Kafka consumer processes orders, atomically deducts inventory, persists orders.
> **Estimated effort:** 1-2 sessions

#### 4a — Project Setup
- [ ] **4.1** Update `order-service/pom.xml` — add: `spring-kafka`, `spring-boot-starter-jdbc`, `postgresql` (runtime), `spring-boot-starter-actuator`, `spring-boot-starter-validation`
- [ ] **4.2** Create `resources/application.yml` (kafka bootstrap-servers, group-id, datasource, server port 8081)
- [ ] **4.3** Create `resources/schema.sql` with `orders` + `order_items` DDL

#### 4b — Kafka Consumer
- [ ] **4.4** Create `KafkaConfig.java` — configure `ConsumerFactory<String, String>`, `ConcurrentKafkaListenerContainerFactory`
- [ ] **4.5** Create `OrderCreatedConsumer.java`:
  - [ ] `@KafkaListener(topics = "order-created", groupId = "${KAFKA_GROUP_ID}")`
  - [ ] Deserialize JSON payload, call `OrderService.processOrder(event)`
  - [ ] Handle deserialization errors gracefully

#### 4c — Atomic Inventory Deduction
- [ ] **4.6** Create `OrderRepository.java` (JdbcTemplate):
  - [ ] `deductStock(UUID productId, int qty)` using: `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`
  - [ ] Return `rowsAffected` — if 0, throw `InsufficientStockException`
- [ ] **4.7** Create `OrderService.java`:
  - [ ] `@Transactional processOrder(OrderCreatedEvent event)`:
    1. For each item: call `deductStock()` — rollback all if any fail
    2. Insert into `orders` table
    3. Batch insert into `order_items`
  - [ ] Catch `InsufficientStockException` — log and mark order CANCELLED
- [ ] **4.8** Create `OrderController.java`:
  - [ ] `GET /api/orders` — ADMIN only, all orders with items
  - [ ] `GET /api/orders/my` — CUSTOMER, their own orders (filter by JWT `sub`)
  - [ ] `PUT /api/orders/:id/status` — ADMIN only, update order status
- [ ] **4.9** Create `JwtFilter.java` (same pattern as catalog-service)
- [ ] **4.10** Test: emit test Kafka message — verify order created in DB + inventory decremented
- [ ] **4.11** Test concurrent checkout — two users buy last item simultaneously, only one succeeds
- [ ] **4.12** Commit: `feat: phase-4 - order-service kafka consumer + atomic inventory`

---

### PHASE 5: Frontend React Restructure
> **Goal:** Two distinct routing experiences: Customer Storefront + Admin Dashboard.
> **Estimated effort:** 2-3 sessions

#### 5a — Foundation
- [ ] **5.1** Update `vite.config.js` — proxy `/api` to `http://localhost:3000` for local dev
- [ ] **5.2** Rewrite `index.css` — design tokens, global styles, Google Font (Outfit)
- [ ] **5.3** Update `App.jsx` — React Router 7 layout:
  ```
  /                 -> CustomerLayout
    /catalog        -> Catalog.jsx
    /cart           -> Cart.jsx
    /checkout       -> Checkout.jsx
    /orders         -> Orders.jsx (protected: CUSTOMER)
  /admin            -> ProtectedRoute (ADMIN) -> AdminLayout
    /admin/products -> AdminProducts.jsx
    /admin/orders   -> AdminOrders.jsx
  /login            -> Login.jsx
  /register         -> Register.jsx
  ```
- [ ] **5.4** Create `context/AuthContext.jsx` — JWT in localStorage, expose `user`, `login()`, `logout()`, `isAdmin`
- [ ] **5.5** Create `context/CartContext.jsx` — sync with `GET /api/cart` on login
- [ ] **5.6** Create `components/ProtectedRoute.jsx` — redirect if not authenticated / not ADMIN

#### 5b — API Layer
- [ ] **5.7** Create `api/auth.js` — `register()`, `login()`, `getMe()`
- [ ] **5.8** Create `api/catalog.js` — `getProducts()`, `searchProducts(q)`, `getProduct(id)`, CRUD functions
- [ ] **5.9** Create `api/cart.js` — `getCart()`, `addItem()`, `updateItem()`, `removeItem()`, `clearCart()`, `checkout()`
- [ ] **5.10** Create `api/orders.js` — `getMyOrders()`, `getAllOrders()`, `updateOrderStatus(id, status)`

#### 5c — Customer Storefront Pages
- [ ] **5.11** `pages/customer/Home.jsx` — hero banner, featured products
- [ ] **5.12** `pages/customer/Catalog.jsx` — debounced search bar + product grid
- [ ] **5.13** `pages/customer/Cart.jsx` — cart items, quantity controls, total, checkout button
- [ ] **5.14** `pages/customer/Checkout.jsx` — 3-step: address -> review -> confirm
- [ ] **5.15** `pages/customer/Orders.jsx` — user's order history with status badges

#### 5d — Admin Dashboard Pages
- [ ] **5.16** `pages/admin/AdminLayout.jsx` — sidebar with nav links
- [ ] **5.17** `pages/admin/Products.jsx` — data table with edit/delete, "Add Product" modal
- [ ] **5.18** `pages/admin/Orders.jsx` — all orders table, status dropdown per row

#### 5e — Shared Components
- [ ] **5.19** `components/Navbar.jsx` — logo, search link, cart badge, user menu
- [ ] **5.20** `components/ProductCard.jsx` — image, name, price/gram, add-to-cart button
- [ ] **5.21** `components/CartDrawer.jsx` — slide-in cart side panel

- [ ] **5.22** Build: `npm run build --prefix frontend` — confirm no errors
- [ ] **5.23** Commit: `feat: phase-5 - frontend customer + admin routing`

---

### PHASE 6: Integration Testing and Polish
> **Goal:** Full end-to-end flow working in Docker.
> **Estimated effort:** 1 session

- [ ] **6.1** Full stack: `docker compose up --build`
- [ ] **6.2** Test customer flow: Register -> Login -> Browse -> Add to Cart -> Checkout -> Verify order in DB + stock reduced
- [ ] **6.3** Test admin flow: Login as ADMIN -> Add product -> Verify in Redis search -> Update order status
- [ ] **6.4** Test search: type in search bar -> results appear (should be near-instant via Redis)
- [ ] **6.5** Test concurrent checkout edge case (2 users, last item)
- [ ] **6.6** Verify NGINX routes: check all `/api/` prefixes resolving to correct services
- [ ] **6.7** Check Redis: `FT.INFO idx:products` — verify index is populated
- [ ] **6.8** Rewrite `README.md` with quickstart guide
- [ ] **6.9** Final commit: `chore: phase-6 - integration tested, production ready`

---

## 8. Key Implementation Notes and Gotchas

### Redis Stack vs Plain Redis
- **Must** use `redis/redis-stack:latest` image — NOT `redis:latest`. The RediSearch module is only in Redis Stack.
- `redis-om-spring` requires `@EnableRedisDocumentRepositories` on the Spring Boot main class.
- If the search index already exists on startup, `redis-om-spring` may throw — catch and ignore the `duplicate index` error during startup.

### Kafka on Docker (Critical)
- Kafka requires **two listener configs** — one for inter-container (Docker network) and one for host access:
  ```
  KAFKA_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://0.0.0.0:29092
  KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
  ```
- Topic `order-created` auto-creation: set `KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'` in compose for dev.
- Consumer group offset: use `auto-offset-reset: earliest` so no messages are missed on restart.

### JWT Across Services (Shared Secret Pattern)
- `JWT_SECRET` is **shared** between all three services.
- `user-service` signs tokens; `catalog-service` and `order-service` verify tokens **locally** using the shared secret.
- Do NOT call `user-service` from other services just to validate a token — that creates a synchronous dependency.
- JWT payload must include: `{ "sub": "<userId>", "email": "<email>", "role": "ADMIN|CUSTOMER", "iat": ..., "exp": ... }`

### Inventory Race Condition (Critical)
- The `SELECT ... FOR UPDATE` or the conditional `UPDATE ... WHERE stock_quantity >= :qty` pattern prevents overselling.
- **Never** deduct inventory in `user-service` — inventory is the `order-service`'s responsibility after consuming the Kafka event.
- The Kafka event is committed (offset advanced) only after the transaction commits — this ensures at-least-once delivery.

### NGINX SPA Fallback
- React Router uses client-side routing — NGINX must serve `index.html` for all non-API routes:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- API routes must be matched **before** this fallback location block.

### Postgres ENUM Types
- ENUMs must exist before the tables that reference them.
- Use the `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` guard pattern in schema.sql since Spring Boot runs `schema.sql` on every startup.

### Cart Checkout Flow (Async Pattern)
- `POST /api/cart/checkout` should:
  1. Fetch cart from Redis (fail with 400 if empty)
  2. Calculate total price from item data
  3. Emit Kafka event (fire and forget — do NOT wait for order-service)
  4. Clear the Redis cart
  5. Return `{ message: "Order placed", eventId: "<uuid>" }`
- The actual `orderId` is created asynchronously by `order-service`. Frontend should show a "processing" state and allow users to check `GET /api/orders/my` for the result.

### Frontend API Base URL
- In Docker: frontend is built and served by NGINX — all `/api` calls go to the same origin (port 3000) — no CORS issues.
- In Dev (Vite): configure `vite.config.js` proxy to forward `/api` to `localhost:3000`.

---

## 9. Running the Stack Locally

### Prerequisites
- Docker Desktop (WSL2 backend on Windows)
- Node.js 22+ (for frontend dev outside Docker)
- Java 21 + Maven (optional, for running Java services outside Docker)

### Full Stack (Docker)
```powershell
# 1. Copy env file
Copy-Item .env.example .env

# 2. Build and start everything
docker compose up --build -d

# 3. Check all services healthy
docker compose ps

# 4. Open the app
Start-Process "http://localhost:3000"

# 5. Open RedisInsight (debug Redis data and indexes)
Start-Process "http://localhost:8001"

# Tear down (add -v to wipe volumes / reset DB + Redis)
docker compose down
docker compose down -v
```

### Frontend Dev Only (Hot Reload)
```powershell
# Start infrastructure only
docker compose up -d postgres redis kafka user-service catalog-service order-service nginx

# Run Vite dev server (proxies /api to localhost:3000)
cd frontend
npm install
npm run dev   # opens http://localhost:5173
```

### Useful Debug Commands
```powershell
# Watch Kafka topic live
docker compose exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic order-created --from-beginning

# Redis CLI
docker compose exec redis redis-cli

# Check search index info
docker compose exec redis redis-cli FT.INFO idx:products

# Search products in Redis
docker compose exec redis redis-cli FT.SEARCH idx:products "@name:turmeric"

# Postgres psql
docker compose exec postgres psql -U shasthi -d shasthi

# View all orders in DB
docker compose exec postgres psql -U shasthi -d shasthi -c "SELECT * FROM orders;"
```

---

*End of Implementation Plan — update task statuses as each item is completed.*
