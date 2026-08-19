# Architecture and design decisions

## One-minute explanation

Shasthi is a small e-commerce system with a React client and three narrowly scoped backend services. The design uses synchronous HTTP only where the customer needs an immediate answer, and PostgreSQL for data that must survive restarts. It intentionally does **not** include a message broker, Kubernetes, cache, or API gateway: the current product scope does not justify them.

```text
Browser -> Nginx/React -> Catalog (Node) --------> PostgreSQL
                      -> Orders (Spring Boot) --+-> PostgreSQL
                      -> Insights (FastAPI)

Orders -> Catalog (server-to-server, price and availability check)
```

## Service boundaries

| Service | Owns | Why it exists |
| --- | --- | --- |
| Catalog, Node/Express | products, price, availability | Product CRUD is lightweight and changes independently of checkout. |
| Orders, Spring Boot | immutable order snapshots | Java validation and transactions make the order workflow explicit and reliable. |
| Insights, FastAPI | basket recommendation rule | A small, isolated place for Python recommendation logic that can later host an ML model. |
| React/Nginx | customer and admin UI | Nginx serves the compiled UI and keeps internal service URLs out of browser code. |

The catalog and orders share one PostgreSQL *instance* to keep the local project easy to run, but own separate tables and access paths. A production scale-out can move each service to its own database without changing the public APIs.

## Checkout flow

1. The browser sends only product IDs and quantities.
2. The order service calls the catalog service with a short timeout.
3. Catalog price and availability are used to create the order-line snapshot.
4. Spring Boot writes the order header and all items in one database transaction.
5. The confirmation contains the server-calculated total.

The browser never supplies the accepted price. This prevents simple price tampering and means historical orders retain the price paid even when the catalog changes later.

## Reliability and security choices

- Docker health checks delay dependent services until PostgreSQL and catalog are ready.
- Services are stateless; PostgreSQL data sits in a named Docker volume.
- The order-to-catalog HTTP client has short connect/read timeouts so checkout fails quickly instead of hanging.
- Product mutations and order history require `X-Admin-Key`; configure `ADMIN_KEY` outside source control.
- Input validation exists at service boundaries and cart size is capped at 20 lines.

## Deliberate trade-offs

- Checkout uses a synchronous catalog lookup. It is simple and gives accurate live availability. At higher traffic, add inventory reservation and an outbox/event flow.
- The local admin key is a demo authentication mechanism, not a replacement for real user authentication. A production version should use hashed credentials and role-bearing sessions or JWTs.
- PostgreSQL schema setup is application-owned for this portfolio project. Adopt versioned migrations (for example Flyway) once multiple deployment environments exist.

## How to discuss it in an interview

> I started with service boundaries that match the business: catalog, orders, and recommendations. I kept deployment simple with Docker Compose and one PostgreSQL instance, but protected correctness by letting the order service obtain the current price from catalog and persist an immutable order snapshot in a transaction. I deliberately avoided distributed infrastructure until the workload requires it.
