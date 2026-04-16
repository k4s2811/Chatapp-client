# Stage 1: Build (Using Stable Node 22)
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (Stable environment prevents Exit Code 1)
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (The most stable way to serve React)
FROM nginx:alpine

# Copy the built files from Vite's 'dist' folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a custom config on the fly to support Port 5100 and React Routing
RUN echo 'server { \
    listen 5100; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5100

CMD ["nginx", "-g", "daemon off;"]