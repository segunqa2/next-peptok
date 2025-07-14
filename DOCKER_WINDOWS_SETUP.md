# Docker Setup Guide for Windows

This guide helps you set up and troubleshoot Docker on Windows for the Peptok application.

## Prerequisites

### Docker Desktop Requirements

- Windows 10 version 2004 or higher (Build 19041 or higher)
- WSL 2 enabled (recommended)
- Hyper-V enabled (if not using WSL 2)
- At least 4GB RAM
- BIOS-level hardware virtualization support enabled

### Install Docker Desktop

1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Run the installer as Administrator
3. Enable WSL 2 integration during installation (recommended)
4. Restart your computer when prompted

## Running the Application

### Option 1: PowerShell Script (Recommended)

```powershell
.\docker-start.ps1
```

### Option 2: Batch File (If PowerShell is restricted)

```cmd
docker-start.bat
```

### Option 3: Manual Commands

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Common Windows Issues and Solutions

### 1. PowerShell Execution Policy Error

**Error**: "cannot be loaded because running scripts is disabled on this system"

**Solution**:

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Port Already in Use

**Error**: "Port 8080 is already allocated"

**Solutions**:

- The scripts automatically handle this, but if manual cleanup is needed:

```cmd
# Find process using port
netstat -ano | findstr :8080

# Kill process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### 3. WSL 2 Issues

**Error**: "WSL 2 installation is incomplete"

**Solution**:

1. Enable WSL feature:

```powershell
# Run as Administrator
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

2. Download and install WSL 2 kernel update
3. Set WSL 2 as default:

```cmd
wsl --set-default-version 2
```

### 4. Docker Desktop Not Starting

**Solutions**:

1. Restart Docker Desktop service:

```cmd
# Run as Administrator
net stop com.docker.service
net start com.docker.service
```

2. Reset Docker Desktop:
   - Right-click Docker Desktop icon → Troubleshoot → Reset to factory defaults

### 5. Volume Mount Issues

**Error**: Files not updating in container

**Solution**:

- Enable file sharing for your project drive in Docker Desktop settings
- Use named volumes (already configured in docker-compose.yml)

### 6. Line Ending Issues

**Error**: Script files not executing properly

**Solution**:

- The Dockerfiles are configured to handle this automatically
- For manual fixing: `git config core.autocrlf true`

## Performance Optimization for Windows

### 1. Use WSL 2 Backend

- In Docker Desktop settings, ensure "Use WSL 2 based engine" is enabled
- Place project files in WSL 2 filesystem for better performance

### 2. Resource Allocation

- Allocate sufficient resources in Docker Desktop settings:
  - Memory: At least 4GB
  - CPU: 2+ cores
  - Disk: 20GB+ available

### 3. Exclude from Windows Defender

Add these folders to Windows Defender exclusions:

- Your project directory
- `C:\Users\{username}\.docker`
- WSL 2 directories

## Troubleshooting Commands

### Check Docker Status

```cmd
docker version
docker compose version
docker info
```

### View Container Logs

```cmd
docker compose logs
docker compose logs frontend
docker compose logs backend
```

### Container Status

```cmd
docker compose ps
docker compose top
```

### Clean Up Everything

```cmd
docker compose down -v
docker system prune -a
docker volume prune
```

## Environment Variables

Create `.env` file in project root:

```env
# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_MOCK_EMAIL=true
VITE_DEBUG_MODE=true

# Backend
NODE_ENV=development
JWT_SECRET=your-dev-jwt-secret-key
CORS_ORIGIN=http://localhost:8080

# Database
POSTGRES_DB=peptok_dev
POSTGRES_USER=peptok_user
POSTGRES_PASSWORD=peptok_password
```

## Support

If you encounter issues not covered here:

1. Check Docker Desktop logs: Settings → Troubleshoot → Show logs
2. Visit [Docker Desktop troubleshooting](https://docs.docker.com/desktop/troubleshoot/)
3. Check the project's GitHub issues

## Quick Reference

| Service     | URL                   | Port |
| ----------- | --------------------- | ---- |
| Frontend    | http://localhost:8080 | 8080 |
| Backend API | http://localhost:3001 | 3001 |
| Database    | localhost:5433        | 5433 |

### Useful Commands

```cmd
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild containers
docker compose build --no-cache

# Reset everything
docker compose down -v && docker system prune -a
```
