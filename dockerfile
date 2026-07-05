# Stage 1: Build (Using Stable Node 22)
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# npm ci is reproducible (installs exactly what's in package-lock.json)
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (The most stable way to serve React)
FROM nginx:alpine

# Custom config lives in its own file instead of an inline echo block
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built files from Vite's 'dist' folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5100

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:5100/ || exit 1

CMD ["nginx", "-g", "daemon off;"]