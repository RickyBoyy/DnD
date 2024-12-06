# Use the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json from the root
COPY ./package.json ./ 

# Copy the backend-specific files
COPY ./BackEnd/. ./

# Install dependencies
RUN npm install

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
