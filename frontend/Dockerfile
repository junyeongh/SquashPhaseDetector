# Stage 1: Build Stage
FROM node:22.14.0-alpine AS build

WORKDIR /app

# # Copy package files
# COPY package.json ./
# COPY package-lock.json ./

# # Install dependencies
# RUN npm ci

# # Copy source code
# COPY . .

# # Build the application
# RUN npm run build

# # Stage 2: Production Stage
# FROM nginx:alpine

# # Copy nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Copy built files from the build stage to the production image
# COPY --from=build /app/dist /usr/share/nginx/html

# # Expose port
# EXPOSE 80

# # Container startup command for the web server (nginx in this case)
# CMD ["nginx", "-g", "daemon off;"]
