# Use the official Node.js image
FROM node:16

WORKDIR /app

# Copy the package.json and package-lock.json (if exists) from the src folder
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code from the src folder
COPY ./src ./

# Expose the port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
