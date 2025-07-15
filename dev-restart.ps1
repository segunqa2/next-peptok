#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Restart Peptok development environment

.DESCRIPTION
    Quickly restart the development environment without rebuilding

.PARAMETER Service
    Restart specific service only (frontend, backend, postgres, redis)

.PARAMETER Clean
    Force clean rebuild

.EXAMPLE
    .\dev-restart.ps1
    Restart all services

.EXAMPLE
    .\dev-restart.ps1 -Service backend
    Restart only backend

.EXAMPLE
    .\dev-restart.ps1 -Clean
    Clean restart with rebuild
#>

param(
    [string]$Service = "",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Color($Color, $Message) {
    Write-Host "${Color}${Message}${Reset}"
}

try {
    if ($Clean) {
        Write-Color $Blue "🔄 Clean restart with rebuild..."
        & ".\dev-start.ps1" -Clean
    } elseif ($Service) {
        Write-Color $Blue "🔄 Restarting service: $Service"
        docker compose -f docker-compose.dev.yml restart $Service
        Write-Color $Green "✅ Service $Service restarted"
    } else {
        Write-Color $Blue "🔄 Restarting all services..."
        docker compose -f docker-compose.dev.yml restart
        Write-Color $Green "✅ All services restarted"
    }

    Write-Host ""
    Write-Color $Yellow "💡 View logs with: .\dev-logs.ps1"

} catch {
    Write-Color $Yellow "⚠️  Error restarting: $($_.Exception.Message)"
    Write-Color $Yellow "Try: .\dev-start.ps1 -Clean"
}
