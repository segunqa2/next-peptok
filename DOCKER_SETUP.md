# Docker Setup Instructions

## Quick Start

### For Windows (PowerShell):

```powershell
.\docker-start.ps1
```

### For Mac/Linux:

```bash
./docker-start.sh
```

### Manual Setup:

```bash
# Clean up existing containers
docker compose down

# Start fresh
docker compose up --build
```

## Services

After starting, the following services will be available:

- **Frontend (React)**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **PostgreSQL Database**: localhost:5433

## Troubleshooting

### Port Conflicts

If you get port conflict errors:

1. **Port 5432 already allocated**: This is common if you have PostgreSQL running locally. We've configured the Docker database to use port 5433 instead.

2. **Other port conflicts**: Use the cleanup scripts (`docker-start.sh` or `docker-start.ps1`) which will automatically stop conflicting processes.

### Missing Files Error

If you see `Cannot find module` errors:

1. The JavaScript mock files have been created for development
2. Make sure you're in the project root directory when running Docker commands

### Backend Issues

The backend includes:

- Mock authentication service with demo users
- Mock data for all endpoints
- CORS configured for frontend communication

### Demo Accounts

Use these accounts to test the platform:

**Platform Admin:**

- Email: `demo@platform.com`
- Password: Any password (demo mode)

**Company Admin:**

- Email: `demo@company.com`
- Password: Any password (demo mode)

**Coach:**

- Email: `demo@coach.com`
- Password: Any password (demo mode)

## Environment Variables

The docker-compose.yml includes default development environment variables. For production, create a `.env` file with:

```env
# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Database Configuration
POSTGRES_DB=peptok_prod
POSTGRES_USER=peptok_user
POSTGRES_PASSWORD=secure-password-here

# CORS Configuration
CORS_ORIGIN=https://yourfrontend.com

# Email Configuration (for production)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-email-password
```

## Development Notes

- The backend currently uses mock data and services for development
- TypeScript files exist for production builds, JavaScript files for development
- Hot reload is enabled for both frontend and backend
- Database schema is automatically created on first run
