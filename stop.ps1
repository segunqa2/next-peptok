#!/usr/bin/env pwsh

<#
.SYNOPSIS
    🛑 Stop Peptok - Clean shutdown

.DESCRIPTION
    Stops all Peptok services cleanly

.EXAMPLE
    .\stop.ps1
#>

$Green = "`e[32m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Color($Color, $Message) {
    Write-Host "${Color}${Message}${Reset}"
}

Write-Color $Blue "🛑 Stopping Peptok Development Environment..."
Write-Host ""

docker compose -f docker-compose.dev.yml down

Write-Color $Green "✅ Peptok stopped successfully"
Write-Host ""
Write-Color $Blue "💡 To start again: .\start.ps1"
