# Resume-ready project summary

## One-line version

Built a Dockerized polyglot e-commerce platform using React, Node.js, Spring Boot, FastAPI, and PostgreSQL, with secure server-side order pricing and an admin catalog workflow.

## Strong resume bullets

- Designed and implemented a right-sized microservice architecture for an e-commerce storefront, separating catalog, order, and recommendation responsibilities across Node.js, Spring Boot, and FastAPI services.
- Secured checkout integrity by moving price calculation from the React client to the Spring Boot order service, which validates live catalog availability and persists immutable order snapshots in PostgreSQL transactions.
- Containerized the complete system with Docker Compose, health checks, dependency startup ordering, persistent data volumes, and a one-command Windows launcher; added protected admin controls for product lifecycle and order review.

## Talking points

- Explain that the project uses microservices to demonstrate technology boundaries, but deliberately avoids unnecessary distributed infrastructure.
- Highlight the trust boundary: browser data is treated as untrusted, so accepted prices are obtained server-side.
- Explain that PostgreSQL persistence and Docker health checks solve restart and startup-order problems without premature complexity.
