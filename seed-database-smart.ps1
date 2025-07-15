#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Smart database seeding script that automatically chooses the right method

.DESCRIPTION
    This script automatically detects if Node.js is available locally and 
    runs either the local npm version or the Docker version accordingly.

.PARAMETER Backend
    Which backend to seed (express or nestjs). Default is nestjs.

.PARAMETER Reset
    Reset the database before seeding

.EXAMPLE
    .\seed-database-smart.ps1
    Automatically detect and run appropriate seeding method

.EXAMPLE
    .\seed-database-smart.ps1 -Reset
    Reset and seed using best available method
#>

param(
    [Parameter()]
    [ValidateSet("express", "nestjs")]
    [string]$Backend = "nestjs",
    
    [Parameter()]
    [switch]$Reset
)

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param($Color, $Message)
    Write-Host "${Color}${Message}${Reset}"
}

Write-ColorOutput $Blue "🧠 Smart Database Seeding Utility"

# Check if npm is available
$npmAvailable = $false
try {
    npm --version | Out-Null
    $npmAvailable = $true
    Write-ColorOutput $Green "✓ Node.js/npm detected - using local seeding"
    
    # Run local version
    if ($Reset) {
        & ".\seed-database.ps1" -Backend $Backend -Reset
    } else {
        & ".\seed-database.ps1" -Backend $Backend
    }
} catch {
    Write-ColorOutput $Yellow "⚠️  Node.js/npm not found - using Docker seeding"
    
    # Run Docker version
    if ($Reset) {
        & ".\seed-database-docker.ps1" -Backend $Backend -Reset
    } else {
        & ".\seed-database-docker.ps1" -Backend $Backend
    }
}
