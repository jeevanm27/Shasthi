# ─── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY ../frontend/package*.json ./
RUN npm ci
COPY ../frontend/ ./
RUN npm run build

# ─── Stage 2: NGINX with built frontend + routing config ──────────────────────
FROM nginx:alpine
# Copy our custom NGINX config
COPY nginx.conf /etc/nginx/nginx.conf
# Copy built React app into NGINX's html root
COPY --from=frontend-build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
