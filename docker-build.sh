#!/bin/bash

# Docker Build and Run Script for InvoiceTool
# This script helps you build and run the Docker container locally

set -e

echo "🐳 Building Docker image for InvoiceTool..."

# Build the Docker image
docker build -t invoicetool:latest .

echo "✅ Docker image built successfully!"

# Check if container is already running
if [ "$(docker ps -q -f name=invoicetool)" ]; then
    echo "🛑 Stopping existing container..."
    docker stop invoicetool
    docker rm invoicetool
fi

# Ask if user wants to run the container
read -p "Do you want to run the container now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🚀 Starting container..."
    
    # Default database settings (can be overridden)
    DB_URL=${SPRING_DATASOURCE_URL:-"jdbc:mysql://host.docker.internal:3306/invoicetool?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"}
    DB_USERNAME=${SPRING_DATASOURCE_USERNAME:-"root"}
    DB_PASSWORD=${SPRING_DATASOURCE_PASSWORD:-"your_password"}
    
    docker run -d \
        --name invoicetool \
        -p 8080:8080 \
        -e SPRING_DATASOURCE_URL="$DB_URL" \
        -e SPRING_DATASOURCE_USERNAME="$DB_USERNAME" \
        -e SPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
        -e SPRING_PROFILES_ACTIVE=production \
        invoicetool:latest
    
    echo "✅ Container started successfully!"
    echo "📱 Application is available at: http://localhost:8080"
    echo "📋 View logs with: docker logs -f invoicetool"
fi