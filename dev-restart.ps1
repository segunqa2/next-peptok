#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Restart the Peptok coaching platform development containers

.DESCRIPTION
    This script stops and restarts the development Docker containers 
    for the Peptok platform.

.PARAMETER Service
    Restart a specific service (frontend, backend, postgres, redis)

.PARAMETER Build
    Force rebuild before restarting

.PARAMETER Logs
    Show logs after restarting

.EXAMPLE
    .\dev-restart.ps1
    Restart all development containers

.EXAMPLE
    .\dev-restart.ps1 -Service backend
    Restart only the backend service

.EXAMPLE
    .\dev-restart.ps1 -Build -Logs
    Force rebuild and show logs
#>

param(
    [Parameter()]
    [ValidateSet("frontend", "backend", "postgres", "redis")]
    [string]$Service,
    
    [Parameter()]
    [switch]$Build,
    
    [Parameter()]
    [switch]$Logs
)

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

try {
    Write-ColorOutput $Blue "Restarting Peptok Development Environment..."
    
    if ($Service) {
        Write-ColorOutput $Yellow "Targeting service: $Service"
        
        if ($Build) {
            Write-ColorOutput $Yellow "Rebuilding $Service..."
            docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache $Service
        }
        
        Write-ColorOutput $Yellow "Restarting $Service..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml restart $Service
    } else {
        Write-ColorOutput $Yellow "Restarting all services..."
        
        if ($Build) {
            Write-ColorOutput $Yellow "Rebuilding all containers..."
            docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
        }
        
        docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "Failed to restart containers"
        exit 1
    }
    
    Write-ColorOutput $Green "Restart completed successfully!"
    
    # Wait a moment for services to stabilize
    Start-Sleep -Seconds 3
    
    # Show service status
    Write-ColorOutput $Yellow "Service status:"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
    
    Write-Host ""
    Write-ColorOutput $Cyan "Frontend: http://localhost:8080"
    Write-ColorOutput $Cyan "Backend API: http://localhost:3001"
    Write-ColorOutput $Cyan "API Health: http://localhost:3001/health"
    
    # Show logs if requested
    if ($Logs) {
        Write-Host ""
        Write-ColorOutput $Yellow "Showing container logs (Ctrl+C to exit)..."
        if ($Service) {
            docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f $Service
        } else {
            docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
        }
    }
}
catch {
    Write-ColorOutput $Red "An error occurred: $($_.Exception.Message)"
    exit 1
}
