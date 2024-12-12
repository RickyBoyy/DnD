# Example Backend Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package.json and install dependencies
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./  

# Install dependencies
RUN npm install

# Now copy the rest of the app
COPY ./ ./  # Copy the entire project into the container


CMD ["npm", "start"]
