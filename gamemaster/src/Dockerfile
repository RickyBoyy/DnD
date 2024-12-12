# Example Frontend Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire project root to the container
COPY ./ ./



# Build the frontend (if using React or similar)
RUN npm run build

CMD ["npm", "start"]
