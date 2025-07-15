# Docker Scripts Usage Guide

This guide covers all the scripts that have been made Docker-compatible, allowing you to run the full development environment without needing Node.js installed locally.

## 🚀 Quick Start (Docker Only)

If you don't have Node.js installed locally, use these Docker-compatible scripts:

```powershell
# Start the development environment
.\dev-start.ps1

# Seed the database
.\seed-database-docker.ps1

# Validate TypeScript (Linux/Mac)
./scripts/validate-typescript-docker.sh
```

## 📝 Available Scripts

### Development Environment

| Script            | Purpose                   | Docker Compatible | Notes                     |
| ----------------- | ------------------------- | ----------------- | ------------------------- |
| `dev-start.ps1`   | ��� Start dev environment | ✅ Yes            | Fixed to work without npm |
| `dev-stop.ps1`    | Stop dev environment      | ✅ Yes            | Always worked with Docker |
| `dev-restart.ps1` | Restart dev environment   | ✅ Yes            | Always worked with Docker |
| `dev-logs.ps1`    | View container logs       | ✅ Yes            | Always worked with Docker |

### Database Operations

| Script                     | Purpose                   | Docker Compatible   | Notes                                 |
| -------------------------- | ------------------------- | ------------------- | ------------------------------------- |
| `seed-database.ps1`        | Seed database (local npm) | ❌ Requires Node.js | Shows error if npm missing            |
| `seed-database-docker.ps1` | Seed database (Docker)    | ✅ Yes              | **Use this for Docker-only**          |
| `seed-database-smart.ps1`  | Auto-detect method        | ✅ Yes              | **Recommended** - chooses best method |

### TypeScript Validation

| Script                                  | Purpose                 | Docker Compatible   | Notes                                 |
| --------------------------------------- | ----------------------- | ------------------- | ------------------------------------- |
| `scripts/validate-typescript.sh`        | Validate TS (local npm) | ❌ Requires Node.js | Shows error if npm missing            |
| `scripts/validate-typescript-docker.sh` | Validate TS (Docker)    | ✅ Yes              | **Use this for Docker-only**          |
| `scripts/validate-typescript-smart.sh`  | Auto-detect method      | ✅ Yes              | **Recommended** - chooses best method |

### Docker Management

| Script                                | Purpose                 | Docker Compatible | Notes                     |
| ------------------------------------- | ----------------------- | ----------------- | ------------------------- |
| `docker-start.ps1`                    | Start Docker services   | ✅ Yes            | Always worked with Docker |
| `docker-restart.ps1`                  | Restart Docker services | ✅ Yes            | Always worked with Docker |
| `scripts/validate-docker-services.sh` | Validate Docker setup   | ✅ Yes            | Always worked with Docker |

## 🎯 Recommended Workflow (Docker Only)

1. **Start Development Environment:**

   ```powershell
   .\dev-start.ps1
   ```

2. **Seed Database:**

   ```powershell
   .\seed-database-smart.ps1
   ```

3. **Validate TypeScript (Optional):**

   ```bash
   ./scripts/validate-typescript-smart.sh
   ```

4. **Access Applications:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

## 🔧 Script Behaviors

### When Node.js is NOT installed:

- ✅ `dev-start.ps1` - Works (skips npm, uses Docker dependencies)
- ✅ `seed-database-docker.ps1` - Works (runs commands in Docker)
- ✅ `seed-database-smart.ps1` - Works (auto-selects Docker version)
- ❌ `seed-database.ps1` - Fails with helpful error message
- ❌ `scripts/validate-typescript.sh` - Fails with helpful error message

### When Node.js IS installed:

- ✅ All scripts work
- 🎯 Smart scripts prefer local npm for better performance
- 🎯 Docker scripts still available as fallback

## 🐛 Troubleshooting

### "npm is not recognized" Error

- **Solution:** Use the Docker-compatible scripts:
  - `seed-database-docker.ps1` instead of `seed-database.ps1`
  - `validate-typescript-docker.sh` instead of `validate-typescript.sh`

### Container Not Running Errors

- **Solution:** Start the development environment first:
  ```powershell
  .\dev-start.ps1
  ```

### Permission Denied (Linux/Mac)

- **Solution:** Make scripts executable:
  ```bash
  chmod +x scripts/*.sh
  ```

## 💡 Pro Tips

1. **Use Smart Scripts:** The `*-smart.*` scripts automatically choose the best method
2. **Check Container Status:** Use `docker ps` to see running containers
3. **View Logs:** Use `.\dev-logs.ps1` to monitor container output
4. **Database Access:** PostgreSQL is accessible at `localhost:5433`

## 🔄 Migration from Local to Docker

If you were using local npm scripts before:

| Old Command         | New Docker Command                              |
| ------------------- | ----------------------------------------------- |
| `npm run typecheck` | `docker exec peptok-frontend npm run typecheck` |
| `npm run build`     | `docker exec peptok-frontend npm run build`     |
| `npm run seed`      | `docker exec peptok-backend npm run seed`       |

Or simply use the provided wrapper scripts for convenience.
