#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Start the Peptok coaching platform in development mode

.DESCRIPTION
    This script cleans up existing containers and starts the Docker containers 
    for the Peptok platform in development mode with hot reload.

.PARAMETER Clean
    Force clean rebuild of all containers

.PARAMETER Logs
    Show logs after starting containers

.EXAMPLE
    .\dev-start.ps1
    Start in development mode

.EXAMPLE
    .\dev-start.ps1 -Clean -Logs
    Force clean rebuild and show logs
#>

param(
    [Parameter()]
    [switch]$Clean,
    
    [Parameter()]
    [switch]$Logs
)

# Set error handling
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param($Color, $Message)
    Write-Host "${Color}${Message}${Reset}"
}

function Test-DockerInstallation {
    try {
        docker --version | Out-Null
        docker compose version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Stop-ProcessOnPort {
    param($Port)
    
    try {
        if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
            $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            foreach ($connection in $connections) {
                $processId = $connection.OwningProcess
                if ($processId -and $processId -ne 0) {
                    Write-ColorOutput $Yellow "  Stopping process $processId using port $Port..."
                    try {
                        Stop-Process -Id $processId -Force -ErrorAction Stop
                        Write-ColorOutput $Green "  Process stopped successfully"
                    } catch {
                        Write-ColorOutput $Red "  Failed to stop process $processId"
                    }
                }
            }
        }
    } catch {
        Write-ColorOutput $Yellow "  Could not check port $Port"
    }
}

# Main script
try {
    Write-ColorOutput $Blue "Starting Peptok Coaching Platform (Development Mode)..."
    
    # Check Docker installation
    if (-not (Test-DockerInstallation)) {
        Write-ColorOutput $Red "Docker or Docker Compose is not installed or not in PATH"
        Write-ColorOutput $Yellow "Please install Docker Desktop and try again"
        exit 1
    }
    
    # Check if Docker is running
    if (-not (Test-DockerRunning)) {
        Write-ColorOutput $Red "Docker is not running"
        Write-ColorOutput $Yellow "Please start Docker Desktop and try again"
        exit 1
    }
    
    Write-ColorOutput $Green "Docker is ready"
    
    # Clean up existing containers
    Write-ColorOutput $Yellow "Cleaning up existing containers..."
    try {
        docker compose down 2>$null
        docker compose -f docker-compose.dev.yml down 2>$null
    } catch {
        Write-ColorOutput $Yellow "  No containers to stop"
    }
    
    # Free up ports
    Write-ColorOutput $Yellow "Freeing up ports..."
    Stop-ProcessOnPort 8080
    Stop-ProcessOnPort 3001
    Stop-ProcessOnPort 5433
    Stop-ProcessOnPort 6379
    
    # Generate package-lock.json files if they don't exist
    Write-ColorOutput $Yellow "Ensuring package-lock.json files exist..."
    
    if (-not (Test-Path "package-lock.json")) {
        Write-ColorOutput $Yellow "  Generating frontend package-lock.json..."
        npm install --package-lock-only
    }
    
    if (-not (Test-Path "backend-nestjs/package-lock.json")) {
        Write-ColorOutput $Yellow "  Generating backend package-lock.json..."
        Push-Location backend-nestjs
        npm install --package-lock-only
        Pop-Location
    }
    
    Write-ColorOutput $Green "Package-lock files ready"
    
    # Build containers
    if ($Clean) {
        Write-ColorOutput $Yellow "Building containers (clean)..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
    } else {
        Write-ColorOutput $Yellow "Building containers..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml build
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "Failed to build containers"
        exit 1
    }
    
    Write-ColorOutput $Green "Containers built successfully"
    
    # Start containers
    Write-ColorOutput $Yellow "Starting development services..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "Failed to start containers"
        exit 1
    }
    
    # Wait for services to be healthy
    Write-ColorOutput $Yellow "Waiting for services to be healthy..."
    
    $maxAttempts = 60
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        $postgresHealth = docker inspect --format='{{.State.Health.Status}}' peptok-postgres 2>$null
        $redisHealth = docker inspect --format='{{.State.Health.Status}}' peptok-redis 2>$null
        $backendHealth = docker inspect --format='{{.State.Health.Status}}' peptok-backend 2>$null
        $frontendHealth = docker inspect --format='{{.State.Health.Status}}' peptok-frontend 2>$null
        
        $allHealthy = ($postgresHealth -eq "healthy") -and 
                     ($redisHealth -eq "healthy") -and 
                     ($backendHealth -eq "healthy") -and 
                     ($frontendHealth -eq "healthy")
        
        if ($allHealthy) {
            break
        }
        
        Start-Sleep -Seconds 2
        $attempt++
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    
    if ($attempt -eq $maxAttempts) {
        Write-ColorOutput $Yellow "Services may not be fully healthy yet."
        Write-ColorOutput $Yellow "   This is normal for development mode. Check logs if issues persist."
    } else {
        Write-ColorOutput $Green "All services are healthy!"
    }
    
    # Show service URLs
    Write-ColorOutput $Green "Peptok Platform is running in development mode!"
    Write-Host ""
    Write-ColorOutput $Cyan "Frontend (Hot Reload): http://localhost:8080"
    Write-ColorOutput $Cyan "Backend API (Hot Reload): http://localhost:3001"
    Write-ColorOutput $Cyan "API Health: http://localhost:3001/health"
    Write-ColorOutput $Cyan "Database: localhost:5433"
    Write-ColorOutput $Cyan "Redis: localhost:6379"
    
    Write-Host ""
    Write-ColorOutput $Yellow "Available commands:"
    Write-ColorOutput $Yellow "  - View logs: docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
    Write-ColorOutput $Yellow "  - Stop services: docker compose -f docker-compose.yml -f docker-compose.dev.yml down"
    Write-ColorOutput $Yellow "  - Restart service: docker compose -f docker-compose.yml -f docker-compose.dev.yml restart [service]"
    
    # Show logs if requested
    if ($Logs) {
        Write-Host ""
        Write-ColorOutput $Yellow "Showing container logs (Ctrl+C to exit)..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    }
}
catch {
    Write-ColorOutput $Red "An error occurred: $($_.Exception.Message)"
    Write-ColorOutput $Yellow "Try running with -Clean flag to force rebuild"
    exit 1
}
