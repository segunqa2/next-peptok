#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Stop the Peptok coaching platform development containers

.DESCRIPTION
    This script stops and removes all development Docker containers 
    for the Peptok platform.

.PARAMETER Volumes
    Also remove development volumes

.EXAMPLE
    .\dev-stop.ps1
    Stop development containers

.EXAMPLE
    .\dev-stop.ps1 -Volumes
    Stop containers and remove volumes
#>

param(
    [Parameter()]
    [switch]$Volumes
)

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param($Color, $Message)
    Write-Host "${Color}${Message}${Reset}"
}

try {
    Write-ColorOutput $Blue "🛑 Stopping Peptok Development Environment..."
    
    # Stop and remove containers
    Write-ColorOutput $Yellow "🔄 Stopping development containers..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Yellow "⚠️  Some containers may have already been stopped"
    } else {
        Write-ColorOutput $Green "✅ Development containers stopped successfully"
    }
    
    # Remove volumes if requested
    if ($Volumes) {
        Write-ColorOutput $Yellow "🗑️  Removing development volumes..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
        
        # Also remove named volumes
        try {
            docker volume rm peptok_backend-node-modules 2>$null
            docker volume rm peptok_frontend-node-modules 2>$null
            docker volume rm peptok_postgres_data 2>$null
            docker volume rm peptok_redis_data 2>$null
        } catch {
            Write-ColorOutput $Yellow "  Some volumes may not exist or are in use"
        }
        
        Write-ColorOutput $Green "✅ Development volumes removed"
    }
    
    Write-ColorOutput $Green "🎉 Development environment stopped successfully!"
    Write-Host ""
    Write-ColorOutput $Yellow "💡 To start again, run: .\dev-start.ps1"
}
catch {
    Write-ColorOutput $Red "�� An error occurred: $($_.Exception.Message)"
    exit 1
}
