# Peptok Development Environment

## 🚀 Super Quick Start

1. **Start Everything (One Command!)**

   ```powershell
   .\start.ps1
   ```

2. **Access the Application**

   - Frontend: http://localhost:8080 (React with hot reload)
   - Backend: http://localhost:3001 (NestJS with hot reload)

3. **Stop Everything**

   ```powershell
   .\stop.ps1
   ```

That's it! The environment is designed to be that simple.

## All Available Commands

### 🎯 Simple Commands (Recommended)

| Command       | Description      |
| ------------- | ---------------- |
| `.\start.ps1` | Start everything |
| `.\stop.ps1`  | Stop everything  |

### 🔧 Advanced Commands

| Command                              | Description                |
| ------------------------------------ | -------------------------- |
| `.\dev-start.ps1`                    | Start with full output     |
| `.\dev-start.ps1 -Clean`             | Start with clean rebuild   |
| `.\dev-start.ps1 -Logs`              | Start and show logs        |
| `.\dev-stop.ps1`                     | Stop all services          |
| `.\dev-restart.ps1`                  | Restart all services       |
| `.\dev-restart.ps1 -Service backend` | Restart specific service   |
| `.\dev-logs.ps1`                     | View all logs              |
| `.\dev-logs.ps1 -Service frontend`   | View specific service logs |

## Services

- **Frontend (React)**: Port 8080 with hot reload
- **Backend (NestJS)**: Port 3001 with hot reload
- **Database (PostgreSQL)**: Port 5432
- **Cache (Redis)**: Port 6379

## Features

✅ **Hot Reload**: Both frontend and backend automatically reload on code changes  
✅ **TypeScript**: Full TypeScript support with type checking  
✅ **API Integration**: Frontend configured to use NestJS backend  
✅ **Database**: PostgreSQL with automatic schema initialization  
✅ **Cache**: Redis for session and data caching

## Troubleshooting

**Port conflicts?**

```powershell
.\dev-start.ps1 -Clean
```

**Services not responding?**

```powershell
.\dev-logs.ps1
```

**Complete reset?**

```powershell
.\dev-stop.ps1
.\dev-start.ps1 -Clean
```

## Development Workflow

1. Make changes to your code
2. Changes are automatically detected and reloaded
3. View logs if needed: `.\dev-logs.ps1`
4. No need to restart unless changing Docker configuration

The environment is designed to be simple and just work!
