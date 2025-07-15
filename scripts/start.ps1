#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Start the Peptok coaching platform containers

.DESCRIPTION
    This script starts the Docker containers for the Peptok platform.
    It can run in development or production mode.

.PARAMETER Environment
    The environment to run (development or production). Default is development.

.PARAMETER Build
    Force rebuild of containers before starting

.PARAMETER Logs
    Show logs after starting containers

.EXAMPLE
    .\scripts\start.ps1
    Start in development mode

.EXAMPLE
    .\scripts\start.ps1 -Environment production
    Start in production mode

.EXAMPLE
    .\scripts\start.ps1 -Build -Logs
    Force rebuild and show logs
#>

param(
    [Parameter()]
    [ValidateSet("development", "production")]
    [string]$Environment = "development",
    
    [Parameter()]
    [switch]$Build,
    
    [Parameter()]
    [switch]$Logs
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

function Test-DockerInstallation {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Main script
try {
    Write-ColorOutput $Blue "Starting Peptok Coaching Platform..."
    Write-ColorOutput $Yellow "Environment: $Environment"
    
    # Check Docker installation
    if (-not (Test-DockerInstallation)) {
        Write-ColorOutput $Red "Docker or Docker Compose is not installed or not in PATH"
        Write-ColorOutput $Yellow "Please install Docker Desktop and try again"
        exit 1
    }
    
    # Check if Docker is running
    if (-not (Test-DockerRunning)) {
        Write-ColorOutput $Red "Docker is not running"
        Write-ColorOutput $Yellow "Please start Docker Desktop and try again"
        exit 1
    }
    
    # Navigate to project root
    $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = Split-Path -Parent $ScriptPath
    Set-Location $ProjectRoot
    
    Write-ColorOutput $Green "Working directory: $(Get-Location)"
    
    # Prepare docker-compose command
    $ComposeFiles = @("docker-compose.yml")
    
    if ($Environment -eq "development") {
        $ComposeFiles += "docker-compose.dev.yml"
        Write-ColorOutput $Yellow "Running in development mode with hot reload"
    }
    else {
        Write-ColorOutput $Yellow "Running in production mode"
    }
    
    $ComposeArgs = @()
    foreach ($file in $ComposeFiles) {
        $ComposeArgs += "-f"
        $ComposeArgs += $file
    }
    
    # Build containers if requested
    if ($Build) {
        Write-ColorOutput $Yellow "Building containers..."
        & docker-compose @ComposeArgs build --no-cache
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput $Red "Failed to build containers"
            exit 1
        }
    }
    
    # Start containers
    Write-ColorOutput $Yellow "Starting containers..."
    & docker-compose @ComposeArgs up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "Failed to start containers"
        exit 1
    }
    
    # Wait for services to be healthy
    Write-ColorOutput $Yellow "Waiting for services to be healthy..."
    
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        $backendHealth = docker inspect --format='{{.State.Health.Status}}' peptok-backend 2>$null
        $frontendHealth = docker inspect --format='{{.State.Health.Status}}' peptok-frontend 2>$null
        
        if ($backendHealth -eq "healthy" -and $frontendHealth -eq "healthy") {
            break
        }
        
        Start-Sleep -Seconds 2
        $attempt++
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    
    if ($attempt -eq $maxAttempts) {
        Write-ColorOutput $Red "Services may not be fully healthy yet. Check logs with: .\scripts\logs.ps1"
    }
    else {
        Write-ColorOutput $Green "All services are healthy!"
    }
    
    # Show service URLs
    Write-ColorOutput $Green "Peptok Platform is running!"
    Write-Host ""
    
    if ($Environment -eq "development") {
        Write-ColorOutput $Blue "Frontend (Development): http://localhost:3000"
        Write-ColorOutput $Blue "Backend API: http://localhost:3001"
        Write-ColorOutput $Blue "API Health: http://localhost:3001/health"
    }
    else {
        Write-ColorOutput $Blue "Frontend: http://localhost"
        Write-ColorOutput $Blue "Backend API: http://localhost:3001"
        Write-ColorOutput $Blue "API Health: http://localhost:3001/health"
    }
    
    Write-Host ""
    Write-ColorOutput $Yellow "Available commands:"
    Write-ColorOutput $Yellow "  - View logs: .\scripts\logs.ps1"
    Write-ColorOutput $Yellow "  - Stop services: .\scripts\stop.ps1"
    Write-ColorOutput $Yellow "  - Restart services: .\scripts\restart.ps1"
    
    # Show logs if requested
    if ($Logs) {
        Write-Host ""
        Write-ColorOutput $Yellow "Showing container logs (Ctrl+C to exit)..."
        & docker-compose @ComposeArgs logs -f
    }
}
catch {
    Write-ColorOutput $Red "An error occurred: $($_.Exception.Message)"
    exit 1
}
