# Example Backend Dockerfile
# Use the official Node.js 16 image as the base image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
# This is done first to leverage Docker cache and avoid reinstalling dependencies if only application code changes
COPY package*.json ./

# Install only production dependencies (you can adjust this if you need development dependencies)
RUN npm install --only=prod

# Copy the rest of the application code into the container
COPY ./BackEnd ./ 

# Expose port 5000 for the application
EXPOSE 5000

# Command to run your application
CMD ["npm", "start"]

