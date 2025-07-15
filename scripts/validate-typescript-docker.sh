#!/bin/bash

# TypeScript validation script for frontend (Docker-compatible)
# Ensures the entire frontend is written in TypeScript only

echo "🔍 Validating TypeScript-only frontend (Docker Mode)..."

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running"
    echo "Please start Docker Desktop and run: ./dev-start.ps1"
    exit 1
fi

# Check if frontend container is running
FRONTEND_CONTAINER=$(docker ps --filter "name=peptok-frontend" --format "{{.Names}}")

if [ -z "$FRONTEND_CONTAINER" ]; then
    echo "❌ ERROR: Frontend container is not running"
    echo "Please start the development environment first: ./dev-start.ps1"
    exit 1
fi

echo "✓ Docker containers are running"

# Check for any JavaScript files
JS_FILES=$(find src -name "*.js" -o -name "*.jsx" 2>/dev/null)

if [ -n "$JS_FILES" ]; then
    echo "❌ ERROR: JavaScript files found in TypeScript-only frontend!"
    echo "The following files should be converted to TypeScript:"
    echo "$JS_FILES"
    exit 1
fi

# Check for TypeScript files
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)

if [ "$TS_FILES" -eq 0 ]; then
    echo "❌ ERROR: No TypeScript files found!"
    exit 1
fi

echo "✅ SUCCESS: Found $TS_FILES TypeScript files, no JavaScript files detected"

# Run TypeScript type checking using Docker
echo "🔧 Running TypeScript type checking in Docker container..."
docker exec $FRONTEND_CONTAINER npm run typecheck

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: TypeScript type checking passed"
else
    echo "❌ ERROR: TypeScript type checking failed"
    exit 1
fi

# Test build using Docker
echo "🏗️ Testing TypeScript build in Docker container..."
docker exec $FRONTEND_CONTAINER npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: TypeScript build completed successfully"
    echo "🎉 Frontend is fully TypeScript compliant!"
else
    echo "❌ ERROR: TypeScript build failed"
    exit 1
fi
