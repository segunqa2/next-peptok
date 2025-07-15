#!/usr/bin/env pwsh

<#
.SYNOPSIS
    View logs for Peptok development containers

.DESCRIPTION
    This script shows logs for the development Docker containers.

.PARAMETER Service
    Show logs for a specific service (frontend, backend, postgres, redis)

.PARAMETER Follow
    Follow log output (default)

.PARAMETER Tail
    Number of lines to show from the end of logs (default: 100)

.EXAMPLE
    .\dev-logs.ps1
    Show logs for all services

.EXAMPLE
    .\dev-logs.ps1 -Service backend
    Show logs for backend only

.EXAMPLE
    .\dev-logs.ps1 -Service frontend -Tail 50
    Show last 50 lines of frontend logs
#>

param(
    [Parameter()]
    [ValidateSet("frontend", "backend", "postgres", "redis")]
    [string]$Service,
    
    [Parameter()]
    [switch]$Follow = $true,
    
    [Parameter()]
    [int]$Tail = 100
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
    Write-ColorOutput $Blue "📄 Viewing Peptok Development Logs..."
    
    $composeArgs = @("-f", "docker-compose.yml", "-f", "docker-compose.dev.yml", "logs")
    
    if ($Follow) {
        $composeArgs += "-f"
    }
    
    $composeArgs += "--tail=$Tail"
    
    if ($Service) {
        Write-ColorOutput $Yellow "🎯 Showing logs for: $Service"
        $composeArgs += $Service
    } else {
        Write-ColorOutput $Yellow "📊 Showing logs for all services"
    }
    
    Write-Host ""
    Write-ColorOutput $Cyan "💡 Press Ctrl+C to exit"
    Write-Host ""
    
    & docker compose @composeArgs
}
catch {
    Write-ColorOutput $Red "❌ An error occurred: $($_.Exception.Message)"
    exit 1
}
