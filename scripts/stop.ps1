#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Stop the Peptok coaching platform containers

.DESCRIPTION
    This script stops all running Docker containers for the Peptok platform.

.PARAMETER Remove
    Remove containers after stopping them

.PARAMETER Volumes
    Remove volumes when stopping (WARNING: This will delete all data)

.EXAMPLE
    .\scripts\stop.ps1
    Stop all containers

.EXAMPLE
    .\scripts\stop.ps1 -Remove
    Stop and remove containers

.EXAMPLE
    .\scripts\stop.ps1 -Remove -Volumes
    Stop and remove containers and volumes (deletes all data)
#>

param(
    [Parameter()]
    [switch]$Remove,
    
    [Parameter()]
    [switch]$Volumes
)

# Set error handling
$ErrorActionPreference = "Stop"

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
    Write-ColorOutput $Blue "🛑 Stopping Peptok Coaching Platform..."
    
    # Navigate to project root
    $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = Split-Path -Parent $ScriptPath
    Set-Location $ProjectRoot
    
    # Check if containers are running
    $runningContainers = docker ps --filter "name=peptok" --format "table {{.Names}}" | Select-Object -Skip 1
    
    if (-not $runningContainers) {
        Write-ColorOutput $Yellow "ℹ️  No Peptok containers are currently running"
        return
    }
    
    Write-ColorOutput $Yellow "Found running containers:"
    foreach ($container in $runningContainers) {
        Write-ColorOutput $Yellow "  - $container"
    }
    
    # Prepare docker-compose files
    $ComposeFiles = @("docker-compose.yml")
    
    # Check if development override exists
    if (Test-Path "docker-compose.dev.yml") {
        $ComposeFiles += "docker-compose.dev.yml"
    }
    
    $ComposeArgs = @()
    foreach ($file in $ComposeFiles) {
        $ComposeArgs += "-f"
        $ComposeArgs += $file
    }
    
    # Stop containers
    Write-ColorOutput $Yellow "⏹️  Stopping containers..."
    & docker-compose @ComposeArgs stop
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "❌ Failed to stop some containers"
        exit 1
    }
    
    Write-ColorOutput $Green "✅ All containers stopped successfully"
    
    # Remove containers if requested
    if ($Remove) {
        Write-ColorOutput $Yellow "🗑️  Removing containers..."
        
        if ($Volumes) {
            Write-ColorOutput $Red "⚠️  WARNING: This will delete all data in volumes!"
            $confirmation = Read-Host "Are you sure you want to continue? (y/N)"
            
            if ($confirmation -notmatch "^[Yy]$") {
                Write-ColorOutput $Yellow "ℹ️  Operation cancelled"
                return
            }
            
            & docker-compose @ComposeArgs down -v --remove-orphans
            Write-ColorOutput $Green "✅ Containers and volumes removed"
        }
        else {
            & docker-compose @ComposeArgs down --remove-orphans
            Write-ColorOutput $Green "✅ Containers removed"
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput $Red "❌ Failed to remove containers"
            exit 1
        }
    }
    
    # Show status
    Write-Host ""
    Write-ColorOutput $Green "🎉 Peptok Platform stopped successfully!"
    
    if (-not $Remove) {
        Write-Host ""
        Write-ColorOutput $Yellow "💡 Tip: Use 'docker-compose start' to start the stopped containers quickly"
        Write-ColorOutput $Yellow "     Or use '.\scripts\start.ps1' to start fresh"
    }
    
    # Clean up unused Docker resources
    Write-Host ""
    $cleanup = Read-Host "Would you like to clean up unused Docker resources? (y/N)"
    
    if ($cleanup -match "^[Yy]$") {
        Write-ColorOutput $Yellow "🧹 Cleaning up unused Docker resources..."
        docker system prune -f
        Write-ColorOutput $Green "✅ Cleanup completed"
    }
}
catch {
    Write-ColorOutput $Red "❌ An error occurred: $($_.Exception.Message)"
    exit 1
}
