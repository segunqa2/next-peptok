#!/bin/bash

echo "🧹 Cleaning up existing containers..."

# Stop and remove existing containers
docker compose down

# Remove any containers that might be using the ports
docker stop $(docker ps -q --filter "publish=8080" --filter "publish=3001" --filter "publish=5433") 2>/dev/null || true
docker rm $(docker ps -aq --filter "publish=8080" --filter "publish=3001" --filter "publish=5433") 2>/dev/null || true

# Kill any processes using the ports (if needed)
echo "🔍 Checking for processes using ports 8080, 3001, 5433..."

# Check and kill processes on port 8080
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8080 is in use, attempting to free it..."
    lsof -ti :8080 | xargs kill -9 2>/dev/null || true
fi

# Check and kill processes on port 3001
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is in use, attempting to free it..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
fi

# Check and kill processes on port 5433 (our custom PostgreSQL port)
if lsof -Pi :5433 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5433 is in use, attempting to free it..."
    lsof -ti :5433 | xargs kill -9 2>/dev/null || true
fi

echo "🚀 Starting containers..."

# Start the containers with clean build (no cache)
docker compose build --no-cache
docker compose up

echo "✅ Docker environment should be running!"
echo "🌐 Frontend: http://localhost:8080"
echo "🔗 Backend API: http://localhost:3001"
echo "🗄️  Database: localhost:5433"
