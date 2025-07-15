#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Build the Peptok coaching platform containers

.DESCRIPTION
    This script builds Docker containers for the Peptok platform.
    It supports both development and production builds.

.PARAMETER Environment
    The environment to build for (development or production). Default is development.

.PARAMETER NoCache
    Build without using cache

.PARAMETER Parallel
    Build containers in parallel (faster but uses more resources)

.EXAMPLE
    .\scripts\build.ps1
    Build for development environment

.EXAMPLE
    .\scripts\build.ps1 -Environment production -NoCache
    Build for production without cache

.EXAMPLE
    .\scripts\build.ps1 -Parallel
    Build with parallel processing
#>

param(
    [Parameter()]
    [ValidateSet("development", "production")]
    [string]$Environment = "development",
    
    [Parameter()]
    [switch]$NoCache,
    
    [Parameter()]
    [switch]$Parallel
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

try {
    Write-ColorOutput $Blue "Building Peptok Coaching Platform..."
    Write-ColorOutput $Yellow "Environment: $Environment"
    
    # Check Docker installation
    if (-not (Test-DockerInstallation)) {
        Write-ColorOutput $Red "Docker or Docker Compose is not installed or not in PATH"
        Write-ColorOutput $Yellow "Please install Docker Desktop and try again"
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
        Write-ColorOutput $Yellow "Building for development environment"
    }
    else {
        Write-ColorOutput $Yellow "Building for production environment"
    }
    
    $ComposeArgs = @()
    foreach ($file in $ComposeFiles) {
        $ComposeArgs += "-f"
        $ComposeArgs += $file
    }
    
    # Prepare build arguments
    $BuildArgs = @("build")
    
    if ($NoCache) {
        $BuildArgs += "--no-cache"
        Write-ColorOutput $Yellow "Building without cache"
    }
    
    if ($Parallel) {
        $BuildArgs += "--parallel"
        Write-ColorOutput $Yellow "Building in parallel"
    }
    
    # Show build information
    Write-Host ""
    Write-ColorOutput $Yellow "Build Configuration:"
    Write-ColorOutput $Yellow "  - Environment: $Environment"
    Write-ColorOutput $Yellow "  - No Cache: $($NoCache.ToString())"
    Write-ColorOutput $Yellow "  - Parallel: $($Parallel.ToString())"
    Write-ColorOutput $Yellow "  - Compose Files: $($ComposeFiles -join ', ')"
    
    # Start build process
    Write-Host ""
    Write-ColorOutput $Blue "Starting build process..."
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    # Execute build
    & docker-compose @ComposeArgs @BuildArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "Build failed!"
        exit 1
    }
    
    $stopwatch.Stop()
    $elapsed = $stopwatch.Elapsed
    
    Write-Host ""
    Write-ColorOutput $Green "Build completed successfully!"
    Write-ColorOutput $Green "Build time: $($elapsed.Minutes)m $($elapsed.Seconds)s"
    
    # Show built images
    Write-Host ""
    Write-ColorOutput $Yellow "Built images:"
    
    $images = docker images --filter "reference=*peptok*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | Select-Object -Skip 1
    
    if ($images) {
        foreach ($image in $images) {
            Write-ColorOutput $Blue "  $image"
        }
    }
    else {
        Write-ColorOutput $Yellow "  No Peptok images found"
    }
    
    # Show next steps
    Write-Host ""
    Write-ColorOutput $Yellow "Next steps:"
    Write-ColorOutput $Yellow "  - Start the platform: .\scripts\start.ps1"
    Write-ColorOutput $Yellow "  - View logs: .\scripts\logs.ps1"
    Write-ColorOutput $Yellow "  - Stop services: .\scripts\stop.ps1"
    
    # Offer to start services
    Write-Host ""
    $startNow = Read-Host "Would you like to start the services now? (y/N)"
    
    if ($startNow -match "^[Yy]$") {
        Write-ColorOutput $Yellow "Starting services..."
        & "$ScriptPath\start.ps1" -Environment $Environment
    }
}
catch {
    Write-ColorOutput $Red "An error occurred during build: $($_.Exception.Message)"
    exit 1
}
