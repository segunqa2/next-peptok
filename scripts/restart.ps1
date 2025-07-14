#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Restart the Peptok coaching platform containers

.DESCRIPTION
    This script restarts Docker containers for the Peptok platform.
    You can restart all services or specific services.

.PARAMETER Service
    Specific service to restart (backend, frontend, proxy). If not specified, all services are restarted.

.PARAMETER Build
    Rebuild containers before restarting

.PARAMETER Environment
    Environment to use (development or production). Default is development.

.EXAMPLE
    .\scripts\restart.ps1
    Restart all services

.EXAMPLE
    .\scripts\restart.ps1 -Service backend
    Restart only the backend service

.EXAMPLE
    .\scripts\restart.ps1 -Build
    Rebuild and restart all services
#>

param(
    [Parameter()]
    [ValidateSet("backend", "frontend", "proxy", "")]
    [string]$Service = "",
    
    [Parameter()]
    [switch]$Build,
    
    [Parameter()]
    [ValidateSet("development", "production")]
    [string]$Environment = "development"
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

function Test-ContainerExists {
    param($ContainerName)
    try {
        docker inspect $ContainerName 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

try {
    Write-ColorOutput $Blue "🔄 Restarting Peptok Coaching Platform..."
    
    if ($Service) {
        Write-ColorOutput $Yellow "🎯 Target service: $Service"
    }
    else {
        Write-ColorOutput $Yellow "🎯 Target: All services"
    }
    
    # Navigate to project root
    $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = Split-Path -Parent $ScriptPath
    Set-Location $ProjectRoot
    
    # Prepare docker-compose files
    $ComposeFiles = @("docker-compose.yml")
    
    if ($Environment -eq "development") {
        $ComposeFiles += "docker-compose.dev.yml"
        Write-ColorOutput $Yellow "🔧 Using development environment"
    }
    else {
        Write-ColorOutput $Yellow "🏭 Using production environment"
    }
    
    $ComposeArgs = @()
    foreach ($file in $ComposeFiles) {
        $ComposeArgs += "-f"
        $ComposeArgs += $file
    }
    
    # Check if containers exist
    $containerNames = @("peptok-backend", "peptok-frontend", "peptok-proxy")
    $existingContainers = @()
    
    foreach ($name in $containerNames) {
        if (Test-ContainerExists $name) {
            $existingContainers += $name
        }
    }
    
    if ($existingContainers.Count -eq 0) {
        Write-ColorOutput $Yellow "ℹ️  No existing containers found. Starting fresh..."
        & "$ScriptPath\start.ps1" -Environment $Environment -Build:$Build
        return
    }
    
    Write-ColorOutput $Green "Found existing containers:"
    foreach ($container in $existingContainers) {
        $status = docker inspect --format='{{.State.Status}}' $container 2>$null
        Write-ColorOutput $Green "  - $container ($status)"
    }
    
    # Build if requested
    if ($Build) {
        Write-ColorOutput $Yellow "🔨 Rebuilding containers..."
        & "$ScriptPath\build.ps1" -Environment $Environment -NoCache
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput $Red "❌ Build failed"
            exit 1
        }
    }
    
    # Stop services
    Write-ColorOutput $Yellow "⏹️  Stopping services..."
    
    if ($Service) {
        & docker-compose @ComposeArgs stop $Service
    }
    else {
        & docker-compose @ComposeArgs stop
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "❌ Failed to stop services"
        exit 1
    }
    
    # Small delay to ensure clean shutdown
    Start-Sleep -Seconds 2
    
    # Start services
    Write-ColorOutput $Yellow "🚀 Starting services..."
    
    if ($Service) {
        & docker-compose @ComposeArgs up -d $Service
    }
    else {
        & docker-compose @ComposeArgs up -d
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "❌ Failed to start services"
        exit 1
    }
    
    # Wait for services to be healthy
    Write-ColorOutput $Yellow "⏳ Waiting for services to be healthy..."
    
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        $allHealthy = $true
        
        if (-not $Service -or $Service -eq "backend") {
            $backendHealth = docker inspect --format='{{.State.Health.Status}}' peptok-backend 2>$null
            if ($backendHealth -ne "healthy" -and $backendHealth -ne "") {
                $allHealthy = $false
            }
        }
        
        if (-not $Service -or $Service -eq "frontend") {
            $frontendHealth = docker inspect --format='{{.State.Health.Status}}' peptok-frontend 2>$null
            if ($frontendHealth -ne "healthy" -and $frontendHealth -ne "") {
                $allHealthy = $false
            }
        }
        
        if ($allHealthy) {
            break
        }
        
        Start-Sleep -Seconds 2
        $attempt++
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    
    if ($attempt -eq $maxAttempts) {
        Write-ColorOutput $Yellow "⚠️  Services may not be fully healthy yet. Check status with:"
        Write-ColorOutput $Yellow "     docker-compose ps"
    }
    else {
        Write-ColorOutput $Green "✅ Services restarted successfully!"
    }
    
    # Show service URLs
    Write-Host ""
    Write-ColorOutput $Green "🌟 Peptok Platform is running!"
    
    if ($Environment -eq "development") {
        Write-ColorOutput $Blue "📱 Frontend (Development): http://localhost:3000"
        Write-ColorOutput $Blue "⚙️  Backend API: http://localhost:3001"
        Write-ColorOutput $Blue "📊 API Health: http://localhost:3001/health"
    }
    else {
        Write-ColorOutput $Blue "📱 Frontend: http://localhost"
        Write-ColorOutput $Blue "⚙️  Backend API: http://localhost:3001"
        Write-ColorOutput $Blue "📊 API Health: http://localhost:3001/health"
    }
    
    # Show container status
    Write-Host ""
    Write-ColorOutput $Yellow "📊 Container Status:"
    & docker-compose @ComposeArgs ps
    
    Write-Host ""
    Write-ColorOutput $Yellow "💡 Useful commands:"
    Write-ColorOutput $Yellow "  - View logs: .\scripts\logs.ps1"
    Write-ColorOutput $Yellow "  - Stop services: .\scripts\stop.ps1"
    Write-ColorOutput $Yellow "  - Rebuild: .\scripts\restart.ps1 -Build"
}
catch {
    Write-ColorOutput $Red "❌ An error occurred during restart: $($_.Exception.Message)"
    exit 1
}
