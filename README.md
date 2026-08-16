# Shasthi Masala

A complete, runnable storefront for a South Indian masala brand. It uses a polyglot microservice architecture behind a React user experience.

## Architecture

| Component | Technology | Responsibility | Port |
| --- | --- | --- | --- |
| `frontend` | React + Vite, served by Nginx | Product discovery, basket, checkout | 3000 |
| `backend` | Node.js + Express | Product catalog API | 8080 |
| `order-service` | Java 21 + Spring Boot | Validated order creation and lookup | 8081 |
| `insights-service` | Python + FastAPI | Basket recommendations | 8082 |

Nginx exposes the three API services to the browser as `/catalog`, `/orders`, and `/insights`; service hostnames stay internal to Docker.

## Run everything with Docker

On Windows, double-click `start.bat`, or run:

```powershell
.\start.ps1
```

The launcher checks Docker Desktop, rebuilds and starts all containers, waits for the site, and opens it in your browser. Use `./start.ps1 -NoBuild` for later starts, or `./stop.ps1` to stop the stack.

You can also start it manually:

```bash
docker compose up --build
```

Open http://localhost:3000. To stop the stack, run `docker compose down`.

## Admin controls

Select **Admin** in the site header and enter the configured `ADMIN_KEY`. The local development default is `shasthi-admin`; set a different value in a `.env` file before deployment. Administrators can add, edit, hide/show, and remove products, and review confirmed orders.

## Run for development

Start each API in a separate terminal:

```bash
cd backend && npm install && npm run dev
cd order-service && mvn spring-boot:run
cd insights-service && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8082
```

Then start the UI with `cd frontend && npm install && npm run dev`. Vite proxies requests to the three local services.

## API overview

- `GET /api/products`, `GET /api/products/:id`, `POST /api/products` — catalog service
- `POST /api/orders`, `GET /api/orders/:id` — order service
- `POST /api/insights/cart` — insights service

The catalog and orders are intentionally in-memory for an effortless first run. Replace these adapters with a dedicated database before production; no credentials are committed in this repository.
