#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Stop Peptok development environment

.DESCRIPTION
    Stops all Peptok development containers and frees up ports

.EXAMPLE
    .\dev-stop.ps1
#>

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
    Write-Color $Blue "🛑 Stopping Peptok Development Environment"
    Write-Host ""

    # Stop containers
    Write-Color $Yellow "🔽 Stopping containers..."
    docker compose -f docker-compose.dev.yml down

    Write-Color $Green "✅ Development environment stopped"
    Write-Host ""
    Write-Color $Yellow "💡 To start again, run: .\dev-start.ps1"

} catch {
    Write-Color $Yellow "⚠️  Error stopping containers: $($_.Exception.Message)"
    Write-Color $Yellow "This is usually normal if containers weren't running"
}
