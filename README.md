# Peptok Coaching Platform 🚀

A comprehensive enterprise mentorship platform connecting retired experts with employees, featuring advanced analytics and success metrics tracking.

## 🌟 Features

- **Expert Directory**: Browse and connect with experienced professionals
- **Employee Dashboard**: Track progress, manage mentorship relationships, and view achievements
- **Company Analytics**: Monitor department performance and employee development metrics
- **Advanced Search**: Find mentors based on expertise, availability, and ratings
- **Real-time Messaging**: Communicate with mentors and track session progress
- **Gamification**: Points, badges, and achievement systems to motivate learning

## 🏗️ Architecture

The platform is built with a modern, scalable architecture:

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Shadcn/ui** for component library
- **React Router** for navigation
- **Framer Motion** for animations

### Backend

- **Node.js** with Express
- **RESTful API** design
- **CORS** enabled for cross-origin requests
- **Rate limiting** for API protection
- **Comprehensive logging** with Morgan

### Infrastructure

- **Docker** containerization
- **Docker Compose** for multi-service orchestration
- **Nginx** for production reverse proxy
- **Health checks** for service monitoring

## 🚀 Quick Start with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [PowerShell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell) (Windows/Linux/macOS)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd peptok-platform
```

### 2. Environment Setup

```powershell
# Copy environment template
copy .env.example .env

# Edit .env file with your configuration (optional for development)
```

### 3. Start the Platform

```powershell
# Start in development mode (with hot reload)
.\scripts\start.ps1

# Or start in production mode
.\scripts\start.ps1 -Environment production

# Build and start (rebuild containers)
.\scripts\start.ps1 -Build
```

### 4. Access the Platform

- **Frontend (Development)**: http://localhost:3000
- **Frontend (Production)**: http://localhost
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 🛠️ Development Commands

### PowerShell Scripts

All management is done through PowerShell scripts for cross-platform compatibility:

```powershell
# Start services
.\scripts\start.ps1 [-Environment <dev|prod>] [-Build] [-Logs]

# Stop services
.\scripts\stop.ps1 [-Remove] [-Volumes]

# Build containers
.\scripts\build.ps1 [-Environment <dev|prod>] [-NoCache] [-Parallel]

# View logs
.\scripts\logs.ps1 [-Service <backend|frontend|proxy>] [-Follow] [-Tail 100]

# Restart services
.\scripts\restart.ps1 [-Service <backend|frontend|proxy>] [-Build]
```

### Docker Compose Commands

Direct Docker Compose commands (alternative to PowerShell scripts):

```bash
# Development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

## 📁 Project Structure

```
peptok-platform/
├── 📱 Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client and services
│   │   ├── types/          # TypeScript type definitions
│   │   └── data/           # Mock data (development)
│   ├── public/            # Static assets
│   ├── Dockerfile         # Production container
│   └── Dockerfile.dev     # Development container
│
├── ⚙️ Backend (Node.js/Express)
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── data/          # Data layer and mock data
│   │   └── server.js      # Express server setup
│   ├── Dockerfile         # Production container
│   └── Dockerfile.dev     # Development container
│
├── 🐳 Docker Configuration
│   ├── docker-compose.yml     # Production orchestration
│   ├── docker-compose.dev.yml # Development overrides
│   └── nginx.conf            # Nginx configuration
│
├── 📝 PowerShell Scripts
│   ├── scripts/start.ps1     # Start platform
│   ├── scripts/stop.ps1      # Stop platform
│   ├── scripts/build.ps1     # Build containers
│   ├── scripts/logs.ps1      # View logs
│   └── scripts/restart.ps1   # Restart services
│
└── 📄 Configuration
    ├── .env.example          # Environment variables template
    └── README.md            # This file
```

## 🔌 API Endpoints

### Experts

- `GET /api/experts` - List experts with filtering
- `GET /api/experts/:id` - Get expert details

### Employees

- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee details

### Connections

- `GET /api/connections` - List mentorship connections
- `POST /api/connections` - Create new connection
- `GET /api/connections/:id` - Get connection details

### Metrics & Analytics

- `GET /api/metrics` - Company success metrics
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/departments` - Department metrics
- `GET /api/dashboard/activities` - Recent activities

### Search

- `GET /api/search?q=query&type=experts` - Search across platform

### Health

- `GET /health` - Service health check

## 🌍 Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Application
NODE_ENV=development
PORT=3001

# URLs
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001/api

# Features
USE_MOCK_DATA=true
DEBUG=true
RATE_LIMIT=100
```

## 📊 Monitoring & Health

### Health Checks

All services include health checks:

- **Backend**: `http://localhost:3001/health`
- **Frontend**: `http://localhost/health`

### Logging

View logs for debugging:

```powershell
# All services
.\scripts\logs.ps1

# Specific service
.\scripts\logs.ps1 -Service backend

# Follow logs in real-time
.\scripts\logs.ps1 -Follow
```

### Container Status

Check container status:

```bash
docker ps                    # Running containers
docker-compose ps           # Service status
docker stats                # Resource usage
```

## 🔧 Development Workflow

### Hot Reload Development

Development mode includes hot reload for both frontend and backend:

```powershell
# Start development environment
.\scripts\start.ps1

# Edit files in src/ - changes will auto-reload
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Making Changes

1. **Frontend Changes**: Edit files in `src/` - Vite will hot reload
2. **Backend Changes**: Edit files in `backend/src/` - Nodemon will restart
3. **New Dependencies**: Rebuild containers with `.\scripts\build.ps1`

### Testing

```bash
# Frontend tests
npm test

# Backend tests (when implemented)
cd backend && npm test
```

## 🚢 Production Deployment

### Building for Production

```powershell
# Build production containers
.\scripts\build.ps1 -Environment production

# Start production environment
.\scripts\start.ps1 -Environment production
```

### Environment Configuration

1. Copy `.env.example` to `.env`
2. Set production values:
   ```bash
   NODE_ENV=production
   FRONTEND_URL=https://your-domain.com
   VITE_API_URL=https://api.your-domain.com
   ```

### Reverse Proxy (Optional)

Use the included Nginx proxy for advanced routing:

```bash
# Start with proxy
docker-compose --profile proxy up -d

# Access via proxy
# Frontend: http://localhost:8080
# API: http://localhost:8080/api
```

## 🛡️ Security Features

- **CORS** protection
- **Rate limiting** on API endpoints
- **Helmet.js** security headers
- **Input validation** and sanitization
- **Non-root containers** for security
- **Health checks** for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test with: `.\scripts\start.ps1 -Build`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Docker not running**:

```powershell
# Check Docker status
docker --version
docker ps

# Start Docker Desktop
```

**Port conflicts**:

```powershell
# Check what's using ports
netstat -an | findstr :3000
netstat -an | findstr :3001

# Kill processes or change ports in .env
```

**Container build failures**:

```powershell
# Clean build
.\scripts\build.ps1 -NoCache

# Clean Docker system
docker system prune -f
```

**Permission issues**:

```bash
# Ensure Docker has proper permissions
# On Linux: add user to docker group
sudo usermod -aG docker $USER
```

### Getting Help

1. Check the logs: `.\scripts\logs.ps1`
2. Verify health: `curl http://localhost:3001/health`
3. Restart services: `.\scripts\restart.ps1`
4. Clean rebuild: `.\scripts\stop.ps1 -Remove && .\scripts\start.ps1 -Build`

---

**Built with ❤️ by the Peptok Team**
