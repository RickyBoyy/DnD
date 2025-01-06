# Use a lightweight Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV FLASK_APP=GameMaster.py

# Expose the Flask app's port
EXPOSE 6000

# Run the Flask application
CMD ["python", "GameMaster.py"]
