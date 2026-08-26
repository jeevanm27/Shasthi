# Shasthi Masala - Full-Stack E-Commerce

## Architecture
5 Docker services: React SPA (Nginx) + Catalog/Auth (Node.js) + Orders (Spring Boot) + Insights (FastAPI) + PostgreSQL

## Features
- JWT Auth (register/login/me) with bcrypt
- Persistent cart (localStorage)
- My Orders (per-user history)
- 3-step checkout with auto-fill
- Skeleton loading, PWA, SEO
- Admin CRUD panel

## Tech Stack
React 18 / Vite 7 / React Router 7 / Node.js 22 / Express 4 / Spring Boot 3 / FastAPI / PostgreSQL 16 / Docker Compose

## Auth API
POST /catalog/api/auth/register
POST /catalog/api/auth/login
GET  /catalog/api/auth/me (Bearer JWT)

## Setup
`npm run build --prefix frontend`  then  `docker compose up -d`  then open http://localhost:3000

## Admin Key: shasthi-admin  |  JWT Secret: shasthi-jwt-secret
