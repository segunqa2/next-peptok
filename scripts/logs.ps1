#!/usr/bin/env pwsh

<#
.SYNOPSIS
    View logs from Peptok coaching platform containers

.DESCRIPTION
    This script displays logs from Docker containers for the Peptok platform.
    You can view logs from all services or specific services.

.PARAMETER Service
    Specific service to view logs from (backend, frontend, proxy)

.PARAMETER Follow
    Follow log output (like tail -f)

.PARAMETER Tail
    Number of lines to show from the end of logs. Default is 100.

.PARAMETER Since
    Show logs since timestamp (e.g., "2023-01-01", "1h", "30m")

.EXAMPLE
    .\scripts\logs.ps1
    View last 100 lines from all services

.EXAMPLE
    .\scripts\logs.ps1 -Service backend -Follow
    Follow backend logs in real-time

.EXAMPLE
    .\scripts\logs.ps1 -Tail 50 -Since "1h"
    View last 50 lines from the past hour
#>

param(
    [Parameter()]
    [ValidateSet("backend", "frontend", "proxy", "")]
    [string]$Service = "",
    
    [Parameter()]
    [switch]$Follow,
    
    [Parameter()]
    [int]$Tail = 100,
    
    [Parameter()]
    [string]$Since = ""
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

function Test-ContainerRunning {
    param($ContainerName)
    try {
        $status = docker inspect --format='{{.State.Status}}' $ContainerName 2>$null
        return $status -eq "running"
    }
    catch {
        return $false
    }
}

try {
    Write-ColorOutput $Blue "Viewing Peptok Platform Logs..."
    
    # Navigate to project root
    $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = Split-Path -Parent $ScriptPath
    Set-Location $ProjectRoot
    
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
    
    # Check if containers are running
    $runningContainers = @()
    $containerNames = @("peptok-backend", "peptok-frontend", "peptok-proxy")
    
    foreach ($name in $containerNames) {
        if (Test-ContainerRunning $name) {
            $runningContainers += $name
        }
    }
    
    if ($runningContainers.Count -eq 0) {
        Write-ColorOutput $Red "No Peptok containers are currently running"
        Write-ColorOutput $Yellow "Start the platform with: .\scripts\start.ps1"
        exit 1
    }
    
    Write-ColorOutput $Green "Found running containers:"
    foreach ($container in $runningContainers) {
        $status = docker inspect --format='{{.State.Status}}' $container
        $uptime = docker inspect --format='{{.State.StartedAt}}' $container
        Write-ColorOutput $Green "  $container ($status, started: $uptime)"
    }
    
    # Prepare logs command
    $LogsArgs = @("logs")
    
    if ($Follow) {
        $LogsArgs += "-f"
        Write-ColorOutput $Yellow "Following logs in real-time (Ctrl+C to exit)"
    }
    
    if ($Tail -gt 0) {
        $LogsArgs += "--tail"
        $LogsArgs += $Tail.ToString()
    }
    
    if ($Since) {
        $LogsArgs += "--since"
        $LogsArgs += $Since
    }
    
    # Add service name if specified
    if ($Service) {
        $LogsArgs += $Service
        Write-ColorOutput $Yellow "Viewing logs for service: $Service"
    }
    else {
        Write-ColorOutput $Yellow "Viewing logs for all services"
    }
    
    # Show configuration
    Write-Host ""
    Write-ColorOutput $Yellow "Log Configuration:"
    Write-ColorOutput $Yellow "  - Service: $(if ($Service) { $Service } else { 'All services' })"
    Write-ColorOutput $Yellow "  - Follow: $($Follow.ToString())"
    Write-ColorOutput $Yellow "  - Tail: $Tail lines"
    Write-ColorOutput $Yellow "  - Since: $(if ($Since) { $Since } else { 'Beginning' })"
    
    Write-Host ""
    Write-ColorOutput $Blue "Logs:"
    Write-Host "════════════════════════════════════════════════════════════════"
    
    # Execute logs command
    & docker-compose @ComposeArgs @LogsArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "Failed to retrieve logs"
        exit 1
    }
}
catch {
    if ($_.Exception.Message -match "interrupt|break") {
        Write-Host ""
        Write-ColorOutput $Yellow "Log viewing stopped by user"
    }
    else {
        Write-ColorOutput $Red "An error occurred: $($_.Exception.Message)"
        exit 1
    }
}
finally {
    Write-Host ""
    Write-ColorOutput $Yellow "Other useful commands:"
    Write-ColorOutput $Yellow "  - View specific service: .\scripts\logs.ps1 -Service backend"
    Write-ColorOutput $Yellow "  - Follow logs: .\scripts\logs.ps1 -Follow"
    Write-ColorOutput $Yellow "  - View recent logs: .\scripts\logs.ps1 -Since '30m'"
    Write-ColorOutput $Yellow "  - Restart services: .\scripts\restart.ps1"
}
