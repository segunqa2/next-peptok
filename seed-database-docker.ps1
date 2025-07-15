#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Seed the database with comprehensive demo data (Docker-compatible)

.DESCRIPTION
    This script runs the database seeding process using Docker containers.
    Works without requiring Node.js to be installed locally.

.PARAMETER Backend
    Which backend to seed (express or nestjs). Default is nestjs.

.PARAMETER Reset
    Reset the database before seeding

.EXAMPLE
    .\seed-database-docker.ps1
    Run seeding for NestJS backend

.EXAMPLE
    .\seed-database-docker.ps1 -Backend nestjs -Reset
    Reset and seed NestJS backend
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
$Red = "`e[31m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$ResetColor = "`e[0m"

function Write-ColorOutput {
    param($Color, $Message)
    Write-Host "${Color}${Message}${ResetColor}"
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

try {
    Write-ColorOutput $Blue "🌱 Database Seeding Utility (Docker Mode)"
    Write-ColorOutput $Yellow "Backend: $Backend"
    
    # Check if Docker is running
    if (-not (Test-DockerRunning)) {
        Write-ColorOutput $Red "❌ Docker is not running"
        Write-ColorOutput $Yellow "Please start Docker Desktop and ensure the database containers are running"
        Write-ColorOutput $Yellow "Run: .\dev-start.ps1 to start the development environment"
        exit 1
    }
    
    Write-ColorOutput $Green "✓ Docker is running"
    
    # Check if database container is running
    Write-ColorOutput $Yellow "🔍 Checking database container..."
    $dbContainer = docker ps --filter "name=peptok-postgres" --format "{{.Names}}"
    
    if (-not $dbContainer) {
        Write-ColorOutput $Red "❌ Database container is not running"
        Write-ColorOutput $Yellow "Please start the development environment first:"
        Write-ColorOutput $Yellow "Run: .\dev-start.ps1"
        exit 1
    }
    
    Write-ColorOutput $Green "✓ Database container is running: $dbContainer"
    
    # Check if backend container is running
    $backendContainer = docker ps --filter "name=peptok-backend" --format "{{.Names}}"
    
    if (-not $backendContainer) {
        Write-ColorOutput $Red "❌ Backend container is not running"
        Write-ColorOutput $Yellow "Please start the development environment first:"
        Write-ColorOutput $Yellow "Run: .\dev-start.ps1"
        exit 1
    }
    
    Write-ColorOutput $Green "✓ Backend container is running: $backendContainer"
    
    if ($Backend -eq "nestjs") {
        Write-ColorOutput $Yellow "🏗️  Preparing NestJS backend for seeding..."
        
        # Reset database if requested
        if ($Reset) {
            Write-ColorOutput $Yellow "🗑️  Resetting database..."
            docker exec peptok-backend npm run schema:drop
            docker exec peptok-backend npm run schema:sync
        }
        
        # Run migrations
        Write-ColorOutput $Yellow "🔧 Running database migrations..."
        docker exec peptok-backend npm run migration:run
        
        # Run seeding
        Write-ColorOutput $Green "🌱 Starting comprehensive database seeding..."
        docker exec peptok-backend npm run seed
        
        Write-ColorOutput $Green "✅ Database seeding completed successfully!"
        
    } elseif ($Backend -eq "express") {
        Write-ColorOutput $Yellow "🏗️  Express backend seeding via Docker..."
        
        # Reset database if requested
        if ($Reset) {
            Write-ColorOutput $Yellow "🗑️  Resetting database..."
            docker exec peptok-postgres psql -U peptok_user -d peptok_dev -f /docker-entrypoint-initdb.d/init.sql
        }
        
        # Express backend seeding not implemented, fallback to NestJS
        Write-ColorOutput $Yellow "⚠️  Express backend seeding not implemented yet"
        Write-ColorOutput $Yellow "Using NestJS backend for seeding instead..."
        
        docker exec peptok-backend npm run seed
    }
    
    Write-ColorOutput $Green "🎉 Database seeding completed!"
    Write-Host ""
    Write-ColorOutput $Cyan "📊 Seeded Data Summary:"
    Write-ColorOutput $Cyan "  • 2 Platform Admins"
    Write-ColorOutput $Cyan "  • 2 Company Admins (including Sarah Johnson)"
    Write-ColorOutput $Cyan "  • 4 Team Members (2 per company)"
    Write-ColorOutput $Cyan "  • 12 Coaches (including Daniel Hayes)"
    Write-ColorOutput $Cyan "  • 2 Companies with subscription tiers"
    Write-Host ""
    Write-ColorOutput $Blue "🔐 Key Login Credentials:"
    Write-ColorOutput $Blue "  Platform Admin: admin@peptok.com / admin123"
    Write-ColorOutput $Blue "  Company Admin: employee1@techcorp.com / emp123 (Sarah Johnson)"
    Write-ColorOutput $Blue "  Team Member: employee2@techcorp.com / emp123 (John Davis)"
    Write-ColorOutput $Blue "  Coach: coach@marketing.com / coach123 (Daniel Hayes)"
    Write-Host ""
    Write-ColorOutput $Yellow "💡 Next Steps:"
    Write-ColorOutput $Yellow "  1. Access frontend at: http://localhost:8080"
    Write-ColorOutput $Yellow "  2. Test login with any of the credentials above"
    Write-ColorOutput $Yellow "  3. Validate session modification functionality at /session-validation"
    
} catch {
    Write-ColorOutput $Red "❌ An error occurred: $($_.Exception.Message)"
    exit 1
}
