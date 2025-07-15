#!/usr/bin/env pwsh

<#
.SYNOPSIS
    🚀 Start Peptok - One command to rule them all!

.DESCRIPTION
    The simplest way to start your Peptok development environment.
    Frontend: http://localhost:3000 (React + Hot Reload)
    Backend: http://localhost:3001 (NestJS + Hot Reload)

.EXAMPLE
    .\start.ps1
    Just start everything!
#>

$Green = "`e[32m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Color($Color, $Message) {
    Write-Host "${Color}${Message}${Reset}"
}

Write-Color $Blue "🚀 Starting Peptok Development Environment..."
Write-Host ""

try {
    # Check Docker
    docker --version | Out-Null
    docker ps | Out-Null
    Write-Color $Green "✅ Docker is ready"
    
    # Start everything
    Write-Host ""
    Write-Color $Blue "Starting all services..."
    docker compose -f docker-compose.dev.yml up -d --build
    
    Write-Host ""
    Write-Color $Green "🎉 Peptok is starting up!"
    Write-Host ""
        Write-Color $Blue "🌐 Frontend: http://localhost:8080"
    Write-Color $Blue "🔧 Backend: http://localhost:3001"
    Write-Host ""
    Write-Color $Blue "📝 View logs: .\dev-logs.ps1"
    Write-Color $Blue "🛑 Stop all: .\dev-stop.ps1"
    
} catch {
    Write-Host "❌ Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Yellow
}
