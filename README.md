# Shasthi Masala

A Dockerized South Indian masala storefront that demonstrates a right-sized polyglot microservice design: React for the web experience, Node.js for catalog, Spring Boot for orders, and FastAPI for recommendations.

## Architecture

| Component | Technology | Responsibility | Port |
| --- | --- | --- | --- |
| `frontend` | React + Vite, served by Nginx | Product discovery, basket, checkout, admin UI | 3000 |
| `backend` | Node.js + Express | Durable product catalog and administration | 8080 |
| `order-service` | Java 21 + Spring Boot | Server-priced transactional order creation | 8081 |
| `insights-service` | Python + FastAPI | Basket recommendations | 8082 |
| `postgres` | PostgreSQL 16 | Persistent product and order data | internal |

Nginx exposes APIs to the browser as `/catalog`, `/orders`, and `/insights`; service hostnames stay internal. PostgreSQL uses a named Docker volume, so catalog and order data survive container restarts.

Read [the architecture guide](docs/ARCHITECTURE.md) for the request flows, trade-offs, and a concise explanation suitable for interviews.

## Run everything with Docker

On Windows, double-click `start.bat`, or run:

```powershell
.\start.ps1
```

The launcher checks Docker Desktop, rebuilds and starts all containers, waits for the site, then opens it in your browser. Use `./start.ps1 -NoBuild` for later starts, or `./stop.ps1` to stop the stack.

You can also run `docker compose up --build` manually. Open http://localhost:3000.

## Admin controls

Select **Admin** in the site header and enter `ADMIN_KEY`. The local default is `shasthi-admin`; set a different value in a `.env` file before deployment. Administrators can add, edit, hide/show, and remove products, and review confirmed orders.

## API overview

- `GET /api/products`, `GET /api/products/:id` — public catalog API
- `POST`, `PUT`, `DELETE /api/products` — administrator catalog API
- `POST /api/orders` — product IDs and quantities only; pricing comes from catalog server-side
- `GET /api/orders`, `GET /api/orders/:id` — administrator order history API
- `POST /api/insights/cart` — basket recommendation API

## Configuration

Copy `.env.example` to `.env` and set a strong `ADMIN_KEY` and `POSTGRES_PASSWORD` before deployment. No real credentials are committed to the repository.
