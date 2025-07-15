#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Start Peptok in development mode with hot reload

.DESCRIPTION
    Simplified script to start the Peptok platform in development mode.
    Frontend: http://localhost:3000 (with hot reload)
    Backend: http://localhost:3001 (with hot reload)

.PARAMETER Clean
    Force clean rebuild of all containers

.PARAMETER Logs
    Show logs after starting

.EXAMPLE
    .\dev-start.ps1
    Start normally

.EXAMPLE
    .\dev-start.ps1 -Clean
    Clean rebuild and start

.EXAMPLE
    .\dev-start.ps1 -Logs
    Start and show logs
#>

param(
    [switch]$Clean,
    [switch]$Logs
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-Color($Color, $Message) {
    Write-Host "${Color}${Message}${Reset}"
}

function Stop-Port($Port) {
    try {
        if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
            $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            foreach ($connection in $connections) {
                if ($connection.OwningProcess -and $connection.OwningProcess -ne 0) {
                    Write-Color $Yellow "Stopping process using port ${Port}..."
                    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # Silently continue if we can't check ports
    }
}

try {
    Write-Color $Blue "🚀 Starting Peptok Development Environment"
    Write-Host ""

    # Check Docker
    try {
        docker --version | Out-Null
        docker compose version | Out-Null
        docker ps | Out-Null
    } catch {
        Write-Color $Red "❌ Docker is not running or not installed"
        Write-Color $Yellow "Please start Docker Desktop and try again"
        exit 1
    }

    Write-Color $Green "✅ Docker is ready"

    # Stop existing containers
    Write-Color $Yellow "🛑 Stopping existing containers..."
    docker compose -f docker-compose.dev.yml down 2>$null | Out-Null

    # Free up ports
    Write-Color $Yellow "🔓 Freeing up ports..."
    Stop-Port 3000
    Stop-Port 3001
    Stop-Port 5432
    Stop-Port 6379

    # Build containers
    if ($Clean) {
        Write-Color $Yellow "🔨 Building containers (clean)..."
        docker compose -f docker-compose.dev.yml build --no-cache
    } else {
        Write-Color $Yellow "🔨 Building containers..."
        docker compose -f docker-compose.dev.yml build
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Color $Red "❌ Failed to build containers"
        exit 1
    }

    # Start containers
    Write-Color $Yellow "▶️  Starting services..."
    docker compose -f docker-compose.dev.yml up -d

    if ($LASTEXITCODE -ne 0) {
        Write-Color $Red "❌ Failed to start containers"
        exit 1
    }

    # Wait for services
    Write-Color $Yellow "⏳ Waiting for services to start..."
    Start-Sleep -Seconds 10

    # Check services
    $frontendOk = $false
    $backendOk = $false

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $frontendOk = $true }
    } catch { }

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $backendOk = $true }
    } catch { }

    Write-Host ""
    Write-Color $Green "🎉 Peptok Development Environment Started!"
    Write-Host ""
    Write-Color $Cyan "🌐 Frontend (React + Hot Reload): http://localhost:3000"
    Write-Color $Cyan "🔧 Backend (NestJS + Hot Reload): http://localhost:3001"
    Write-Color $Cyan "💾 Database (PostgreSQL): localhost:5432"
    Write-Color $Cyan "🗄️  Cache (Redis): localhost:6379"
    Write-Host ""

    if ($frontendOk) {
        Write-Color $Green "✅ Frontend: Ready"
    } else {
        Write-Color $Yellow "⏳ Frontend: Starting up..."
    }

    if ($backendOk) {
        Write-Color $Green "✅ Backend: Ready"
    } else {
        Write-Color $Yellow "⏳ Backend: Starting up..."
    }

    Write-Host ""
    Write-Color $Yellow "📋 Quick Commands:"
    Write-Color $Yellow "  View logs: .\dev-logs.ps1"
    Write-Color $Yellow "  Stop all: .\dev-stop.ps1"
    Write-Color $Yellow "  Restart: .\dev-restart.ps1"

    if ($Logs) {
        Write-Host ""
        Write-Color $Yellow "📝 Showing logs (Ctrl+C to exit)..."
        docker compose -f docker-compose.dev.yml logs -f
    }

} catch {
    Write-Color $Red "❌ Error: $($_.Exception.Message)"
    Write-Color $Yellow "Try running with -Clean flag"
    exit 1
}
