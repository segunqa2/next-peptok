@echo off
REM Windows batch script to clean up and start Docker containers
REM Alternative to docker-start.ps1 for environments where PowerShell is restricted

echo 🧹 Cleaning up existing containers...

REM Stop and remove existing containers
docker compose down 2>nul

REM Remove any containers that might be using the ports
echo 🧹 Removing containers using our ports...
for /f "delims=" %%i in ('docker ps -q --filter "publish=8080" --filter "publish=3001" --filter "publish=5433" 2^>nul') do (
    docker stop %%i 2>nul
    docker rm %%i 2>nul
)

echo 🔍 Checking for processes using ports 8080, 3001, 5433...

REM Function to check and kill processes on specific ports
call :KillProcessOnPort 8080
call :KillProcessOnPort 3001
call :KillProcessOnPort 5433

echo 🚀 Starting containers...

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not accessible. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Start the containers with clean build
echo Building containers...
docker compose build --no-cache
if errorlevel 1 (
    echo ❌ Error building containers
    pause
    exit /b 1
)

echo Starting containers...
docker compose up -d
if errorlevel 1 (
    echo ❌ Error starting containers
    pause
    exit /b 1
)

REM Wait a moment for containers to start
timeout /t 3 /nobreak >nul

echo ✅ Docker environment should be running!
echo 🌐 Frontend: http://localhost:8080
echo 🔗 Backend API: http://localhost:3001
echo 🗄️  Database: localhost:5433
echo.
echo To view logs: docker compose logs -f
echo To stop: docker compose down
pause
exit /b 0

REM Function to kill process on port
:KillProcessOnPort
set PORT=%1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
    if not "%%a"=="0" (
        echo ⚠️  Port %PORT% is in use by process %%a, attempting to free it...
        taskkill /F /PID %%a >nul 2>&1
        if not errorlevel 1 (
            echo ✅ Process %%a stopped successfully
        ) else (
            echo ❌ Failed to stop process %%a
        )
    )
)
goto :eof
