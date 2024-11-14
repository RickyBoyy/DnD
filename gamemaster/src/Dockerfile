# Frontend build from Node.js base image
FROM node:16 AS build-stage

WORKDIR /app

# Copy the frontend package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY ./src ./

# Build the React app
RUN npm run build

# Use NGINX to serve the app
FROM nginx:alpine

# Copy the build folder from the previous stage
COPY --from=build-stage /app/build /usr/share/nginx/html

EXPOSE 80
