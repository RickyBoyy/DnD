# Use the official Node.js image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the server will use (adjust to port 5000 if that's what the app is using)
EXPOSE 5000  

# Command to start the server
CMD ["node", "authServer.js"]
