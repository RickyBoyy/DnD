# Use a Node.js base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy the shared package.json from the root directory
COPY ./package.json ./ 

# Copy the frontend-specific files from ./src
COPY ./src/ ./

# Install dependencies
RUN npm install

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
