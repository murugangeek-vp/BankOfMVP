# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build the Vite app; proxy config is handled by nginx in prod
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to proxy /api calls to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
