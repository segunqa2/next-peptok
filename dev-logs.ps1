#!/usr/bin/env pwsh

<#
.SYNOPSIS
    View logs from Peptok development environment

.DESCRIPTION
    Shows real-time logs from all containers or specific service

.PARAMETER Service
    Show logs for specific service (frontend, backend, postgres, redis)

.PARAMETER Follow
    Follow logs in real-time (default: true)

.EXAMPLE
    .\dev-logs.ps1
    Show all logs

.EXAMPLE
    .\dev-logs.ps1 -Service frontend
    Show only frontend logs

.EXAMPLE
    .\dev-logs.ps1 -Service backend
    Show only backend logs
#>

param(
    [string]$Service = "",
    [switch]$Follow = $true
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-Color($Color, $Message) {
    Write-Host "${Color}${Message}${Reset}"
}

try {
    if ($Service) {
        Write-Color $Blue "📝 Showing logs for: $Service"
        Write-Color $Yellow "Press Ctrl+C to exit"
        Write-Host ""
        
        if ($Follow) {
            docker compose -f docker-compose.dev.yml logs -f $Service
        } else {
            docker compose -f docker-compose.dev.yml logs $Service
        }
    } else {
        Write-Color $Blue "📝 Showing all logs"
        Write-Color $Yellow "Press Ctrl+C to exit"
        Write-Host ""
        
        if ($Follow) {
            docker compose -f docker-compose.dev.yml logs -f
        } else {
            docker compose -f docker-compose.dev.yml logs
        }
    }

} catch {
    Write-Color $Yellow "⚠️  Error viewing logs: $($_.Exception.Message)"
    Write-Color $Cyan "💡 Make sure the development environment is running: .\dev-start.ps1"
}
