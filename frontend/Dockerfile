# Stage 1: Build Stage
FROM node:22.14.0-alpine AS build

WORKDIR /app

RUN corepack enable pnpm && pnpm -v

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production Stage
FROM nginx:latest

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from the build stage to the production image
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Container startup command for the web server (nginx in this case)
CMD ["nginx", "-g", "daemon off;"]
