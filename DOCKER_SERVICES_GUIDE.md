# Docker Services Guide

This document explains the Docker setup for the Peptok platform, including all services and their configurations.

## 🏗️ Architecture Overview

The Peptok platform consists of the following services running in Docker containers:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │    │ NestJS Backend  │    │ Matching Service│
│   (React/Vite)  │◄───┤   (Node.js)     │◄───┤   (Python)      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Infrastructure                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Redis  │  │  Kafka   │  │PostgreSQL│  │  Zookeeper   │   │
│  │  Cache   │  │Messaging │  │Database  │  │   (Kafka)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Services

### 1. Frontend Service

- **Technology**: React 18 + Vite + TypeScript
- **Port**: 8080
- **Purpose**: Web interface for users, coaches, and administrators

### 2. NestJS Backend Service

- **Technology**: NestJS + TypeScript + PostgreSQL
- **Port**: 3001 (mapped to internal 3000)
- **Purpose**: Main API server with REST endpoints
- **Features**:
  - Authentication & Authorization
  - User Management
  - Session Management
  - Payment Processing
  - Real-time Communication (WebSockets)

### 3. Matching Service

- **Technology**: Python + Flask
- **Port**: 5000
- **Purpose**: AI-powered coach matching algorithm
- **Features**:
  - Machine learning-based matching
  - Kafka integration for async processing
  - Redis caching for performance

### 4. Infrastructure Services

#### PostgreSQL Database

- **Port**: 5433 (mapped to internal 5432)
- **Purpose**: Primary data storage
- **Database**: peptok_dev

#### Redis Cache

- **Port**: 6379
- **Purpose**:
  - Session caching
  - Coach data caching
  - Matching result caching
  - Real-time data storage

#### Apache Kafka

- **Ports**: 9092 (internal), 9094 (external)
- **Purpose**: Asynchronous messaging between services
- **Topics**:
  - `matching-requests`: Coach matching requests
  - `matching-responses`: Matching results
  - `matching-errors`: Error handling

#### Zookeeper

- **Port**: 2181
- **Purpose**: Kafka cluster coordination

## 🔧 Configuration

### Environment Variables

#### NestJS Backend

```bash
NODE_ENV=development
PORT=3000
JWT_SECRET=your-dev-jwt-secret-key
FRONTEND_URL=http://localhost:8080
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
REDIS_HOST=redis
REDIS_PORT=6379
DATABASE_HOST=database
DATABASE_PORT=5432
DATABASE_NAME=peptok_dev
DATABASE_USER=peptok_user
DATABASE_PASSWORD=peptok_password
```

#### Matching Service

```bash
FLASK_ENV=development
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
REDIS_HOST=redis
BACKEND_API_URL=http://backend:3000/api
SECRET_KEY=dev-secret-key-change-in-production
```

#### Frontend

```bash
VITE_API_URL=http://localhost:3001/api
VITE_MOCK_EMAIL=true
VITE_DEBUG_MODE=true
```

## 🛠️ Docker Commands

### Start All Services

```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Monitor Services

```bash
# Check service status
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f matching-service
```

### Health Checks

```bash
# NestJS Backend health
curl http://localhost:3001/health

# Matching Service health
curl http://localhost:5000/health

# Frontend (should return HTML)
curl http://localhost:8080
```

### Development Workflow

```bash
# Rebuild and restart services after code changes
docker-compose up -d --build

# Restart specific service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (data will be lost)
docker-compose down -v
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec database psql -U peptok_user -d peptok_dev

# View database logs
docker-compose logs database

# Backup database
docker-compose exec database pg_dump -U peptok_user peptok_dev > backup.sql
```

### Redis Management

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# View Redis logs
docker-compose logs redis

# Monitor Redis activity
docker-compose exec redis redis-cli monitor
```

### Kafka Management

```bash
# List Kafka topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Create a topic
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic test-topic --partitions 1 --replication-factor 1

# View topic messages
docker-compose exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic matching-requests --from-beginning
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting

1. Check Docker daemon is running
2. Ensure ports are not already in use
3. Check Docker logs: `docker-compose logs [service-name]`

#### Database Connection Issues

1. Ensure PostgreSQL container is running: `docker-compose ps`
2. Check database logs: `docker-compose logs database`
3. Verify environment variables in backend service

#### Kafka Connection Issues

1. Ensure Zookeeper is running first
2. Check Kafka broker logs: `docker-compose logs kafka`
3. Verify Kafka bootstrap servers configuration

#### Redis Connection Issues

1. Check Redis container status: `docker-compose ps`
2. Test Redis connection: `docker-compose exec redis redis-cli ping`

#### Frontend Build Issues

1. Clear node_modules volume: `docker-compose down -v`
2. Rebuild containers: `docker-compose up --build`

### Service Dependencies

Services start in this order:

1. Zookeeper
2. Kafka, Redis, PostgreSQL (parallel)
3. NestJS Backend
4. Matching Service
5. Frontend

## 📊 Monitoring

### Service Health Endpoints

- Backend: `GET /health`
- Matching Service: `GET /health`
- Frontend: Returns 200 OK for root path

### Key Metrics to Monitor

- Container CPU/Memory usage
- Database connection count
- Redis memory usage
- Kafka message throughput
- Response times for health checks

### Logs Location

All service logs are available through Docker Compose:

```bash
docker-compose logs [service-name]
```

## 🔐 Security Notes

### Development vs Production

- Current setup is for DEVELOPMENT only
- Production deployment requires:
  - Secure secrets management
  - SSL/TLS certificates
  - Network isolation
  - Resource limits
  - Health monitoring
  - Backup strategies

### Default Credentials (Change in Production)

- Database: `peptok_user / peptok_password`
- JWT Secret: `your-dev-jwt-secret-key`
- App Secret: `dev-secret-key-change-in-production`

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Redis Documentation](https://redis.io/documentation)
