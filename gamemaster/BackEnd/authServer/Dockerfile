# Example Dockerfile for Auth Server
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the root-level package.json and package-lock.json to the working directory
COPY ../../package.json ../../package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy only the authServer code into the container
COPY ./ ./

# Command to start the application
CMD ["node", "authServer.js"]
