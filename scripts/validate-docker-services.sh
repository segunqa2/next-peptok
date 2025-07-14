#!/bin/bash

# Docker Services Validation Script
# This script validates that all required services are properly configured

echo "🔍 Validating Docker Services Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ docker-compose.yml found${NC}"

# Validate docker-compose syntax
echo "📋 Validating docker-compose syntax..."
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ docker-compose.yml syntax is valid${NC}"
else
    echo -e "${RED}❌ docker-compose.yml syntax is invalid${NC}"
    docker-compose config
    exit 1
fi

# Check for required services
echo "🔍 Checking required services..."

REQUIRED_SERVICES=("frontend" "backend" "matching-service" "kafka" "zookeeper" "redis" "database")

for service in "${REQUIRED_SERVICES[@]}"; do
    if docker-compose config --services | grep -q "^${service}$"; then
        echo -e "${GREEN}✅ Service '${service}' is configured${NC}"
    else
        echo -e "${RED}❌ Service '${service}' is missing${NC}"
        exit 1
    fi
done

# Check for required Dockerfiles
echo "🔍 Checking Dockerfiles..."

DOCKERFILES=(
    "backend-nestjs/Dockerfile.dev"
    "backend-nestjs/Dockerfile"
    "matching-service/Dockerfile.dev"
    "Dockerfile.dev"
)

for dockerfile in "${DOCKERFILES[@]}"; do
    if [ -f "$dockerfile" ]; then
        echo -e "${GREEN}✅ $dockerfile exists${NC}"
    else
        echo -e "${RED}❌ $dockerfile missing${NC}"
        exit 1
    fi
done

# Check NestJS backend structure
echo "🔍 Checking NestJS backend structure..."

NESTJS_FILES=(
    "backend-nestjs/package.json"
    "backend-nestjs/src/main.ts"
    "backend-nestjs/src/app.module.ts"
    "backend-nestjs/src/app.controller.ts"
    "backend-nestjs/src/app.service.ts"
)

for file in "${NESTJS_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $file missing${NC}"
    fi
done

# Check matching service structure
echo "🔍 Checking matching service structure..."

MATCHING_FILES=(
    "matching-service/app.py"
    "matching-service/requirements.txt"
    "matching-service/src/config/settings.py"
    "matching-service/src/services/kafka_service.py"
    "matching-service/src/services/redis_service.py"
)

for file in "${MATCHING_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $file missing${NC}"
    fi
done

# Test service connectivity configuration
echo "🔍 Checking service connectivity configuration..."

# Check if backend depends on required services
if docker-compose config | grep -A 10 "backend:" | grep -q "depends_on:"; then
    echo -e "${GREEN}✅ Backend has service dependencies configured${NC}"
else
    echo -e "${YELLOW}⚠️  Backend service dependencies may not be configured${NC}"
fi

# Check if matching service depends on required services
if docker-compose config | grep -A 10 "matching-service:" | grep -q "depends_on:"; then
    echo -e "${GREEN}✅ Matching service has dependencies configured${NC}"
else
    echo -e "${YELLOW}⚠️  Matching service dependencies may not be configured${NC}"
fi

# Validate environment variables
echo "🔍 Checking environment variables..."

# Check if backend has required environment variables
BACKEND_ENV_VARS=("KAFKA_BOOTSTRAP_SERVERS" "REDIS_HOST" "DATABASE_HOST")
for var in "${BACKEND_ENV_VARS[@]}"; do
    if docker-compose config | grep -A 20 "backend:" | grep -q "$var"; then
        echo -e "${GREEN}✅ Backend has $var configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend missing $var environment variable${NC}"
    fi
done

# Check if matching service has required environment variables
MATCHING_ENV_VARS=("KAFKA_BOOTSTRAP_SERVERS" "REDIS_HOST")
for var in "${MATCHING_ENV_VARS[@]}"; do
    if docker-compose config | grep -A 20 "matching-service:" | grep -q "$var"; then
        echo -e "${GREEN}✅ Matching service has $var configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Matching service missing $var environment variable${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Docker services configuration validation completed!${NC}"
echo ""
echo "📝 To start all services, run:"
echo "   docker-compose up -d"
echo ""
echo "📝 To check service health, run:"
echo "   docker-compose ps"
echo "   curl http://localhost:3001/health    # NestJS Backend"
echo "   curl http://localhost:5000/health    # Matching Service"
echo ""
echo "📝 To view logs, run:"
echo "   docker-compose logs -f [service-name]"
