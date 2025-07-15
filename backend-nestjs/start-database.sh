#!/bin/bash

# Peptok PostgreSQL Database Setup Script
echo "🐘 Starting Peptok PostgreSQL Database..."

# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
while ! docker-compose exec postgres pg_isready -U peptok_user -d peptok_dev >/dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
    sleep 1
done

echo "✅ PostgreSQL is ready!"

# Check database connection
echo "🔍 Testing database connection..."
docker-compose exec postgres psql -U peptok_user -d peptok_dev -c "SELECT 'Database connection successful!' as status;"

echo "📊 Database status:"
docker-compose exec postgres psql -U peptok_user -d peptok_dev -c "\l"

echo ""
echo "🎉 Database setup complete!"
echo "📝 Connection details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: peptok_dev"
echo "   Username: peptok_user"
echo "   Password: peptok_password"
echo ""
echo "🚀 You can now start the NestJS backend:"
echo "   cd backend-nestjs && npm run start:dev"
