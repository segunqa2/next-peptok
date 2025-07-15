#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Quick test of the database seeding functionality

.DESCRIPTION
    This script tests if the seeding data is correctly populated in the database
    by checking for the specific users requested.
#>

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

function Test-DatabaseUser {
    param($Email, $ExpectedName, $ExpectedType)
    
    try {
        $result = docker exec peptok-postgres psql -U peptok_user -d peptok_dev -t -c "SELECT name, user_type FROM users WHERE email = '$Email';"
        
        if ($result -and $result.Trim()) {
            $data = $result.Trim() -split '\|'
            $name = $data[0].Trim()
            $userType = $data[1].Trim()
            
            if ($name -eq $ExpectedName -and $userType -eq $ExpectedType) {
                Write-ColorOutput $Green "  ✅ $ExpectedName ($Email) - $ExpectedType"
                return $true
            } else {
                Write-ColorOutput $Red "  ❌ $Email - Expected: $ExpectedName ($ExpectedType), Found: $name ($userType)"
                return $false
            }
        } else {
            Write-ColorOutput $Red "  ❌ $Email - User not found"
            return $false
        }
    } catch {
        Write-ColorOutput $Red "  ❌ Error checking $Email : $($_.Exception.Message)"
        return $false
    }
}

try {
    Write-ColorOutput $Blue "🧪 Testing Database Seeding Results"
    Write-ColorOutput $Yellow "=" * 50
    
    # Check if database is accessible
    Write-ColorOutput $Yellow "🔍 Checking database connection..."
    try {
        $connectionTest = docker exec peptok-postgres psql -U peptok_user -d peptok_dev -c "\dt" 2>$null
        Write-ColorOutput $Green "✓ Database connection successful"
    } catch {
        Write-ColorOutput $Red "❌ Cannot connect to database"
        Write-ColorOutput $Yellow "Please ensure the database container is running: .\dev-start.ps1"
        exit 1
    }
    
    Write-ColorOutput $Yellow "`n🔧 Testing Platform Admins..."
    $platformAdminTests = @(
        @{ Email = "admin@peptok.com"; Name = "Platform Administrator"; Type = "platform_admin" },
        @{ Email = "superadmin@peptok.com"; Name = "Super Administrator"; Type = "platform_admin" }
    )
    
    $passedTests = 0
    $totalTests = 0
    
    foreach ($test in $platformAdminTests) {
        $totalTests++
        if (Test-DatabaseUser $test.Email $test.Name $test.Type) {
            $passedTests++
        }
    }
    
    Write-ColorOutput $Yellow "`n👔 Testing Company Admins..."
    $companyAdminTests = @(
        @{ Email = "employee1@techcorp.com"; Name = "Sarah Johnson"; Type = "company_admin" },
        @{ Email = "admin@innovateco.com"; Name = "Michael Thompson"; Type = "company_admin" }
    )
    
    foreach ($test in $companyAdminTests) {
        $totalTests++
        if (Test-DatabaseUser $test.Email $test.Name $test.Type) {
            $passedTests++
        }
    }
    
    Write-ColorOutput $Yellow "`n👥 Testing Team Members..."
    $teamMemberTests = @(
        @{ Email = "employee2@techcorp.com"; Name = "John Davis"; Type = "team_member" },
        @{ Email = "employee3@techcorp.com"; Name = "Emily Carter"; Type = "team_member" },
        @{ Email = "employee1@innovateco.com"; Name = "Alex Rodriguez"; Type = "team_member" },
        @{ Email = "employee2@innovateco.com"; Name = "Maria Silva"; Type = "team_member" }
    )
    
    foreach ($test in $teamMemberTests) {
        $totalTests++
        if (Test-DatabaseUser $test.Email $test.Name $test.Type) {
            $passedTests++
        }
    }
    
    Write-ColorOutput $Yellow "`n🧑‍🏫 Testing Coaches (including Daniel Hayes)..."
    $coachTests = @(
        @{ Email = "coach@marketing.com"; Name = "Daniel Hayes"; Type = "coach" },
        @{ Email = "lisa.wilson@peptok.com"; Name = "Lisa Wilson"; Type = "coach" },
        @{ Email = "michael.rodriguez@peptok.com"; Name = "Michael Rodriguez"; Type = "coach" },
        @{ Email = "emily.watson@peptok.com"; Name = "Dr. Emily Watson"; Type = "coach" }
    )
    
    foreach ($test in $coachTests) {
        $totalTests++
        if (Test-DatabaseUser $test.Email $test.Name $test.Type) {
            $passedTests++
        }
    }
    
    # Summary
    Write-ColorOutput $Yellow "`n" + "=" * 50
    Write-ColorOutput $Blue "📊 Test Results Summary:"
    Write-ColorOutput $Green "  Passed: $passedTests / $totalTests tests"
    
    if ($passedTests -eq $totalTests) {
        Write-ColorOutput $Green "🎉 All seeding tests passed! Database is properly seeded."
        Write-ColorOutput $Yellow "`n💡 You can now test the application with these credentials:"
        Write-ColorOutput $Cyan "  Sarah Johnson (Company Admin): employee1@techcorp.com / emp123"
        Write-ColorOutput $Cyan "  Daniel Hayes (Coach): coach@marketing.com / coach123"
    } else {
        Write-ColorOutput $Red "⚠️  Some tests failed. Consider running the seeding again:"
        Write-ColorOutput $Yellow "  .\seed-database.ps1 -Reset"
    }
    
    # Additional checks
    Write-ColorOutput $Yellow "`n🔍 Additional Database Stats..."
    try {
        $userCount = docker exec peptok-postgres psql -U peptok_user -d peptok_dev -t -c "SELECT COUNT(*) FROM users;"
        $companyCount = docker exec peptok-postgres psql -U peptok_user -d peptok_dev -t -c "SELECT COUNT(*) FROM companies;"
        $coachCount = docker exec peptok-postgres psql -U peptok_user -d peptok_dev -t -c "SELECT COUNT(*) FROM coaches;"
        
        Write-ColorOutput $Cyan "  Total Users: $($userCount.Trim())"
        Write-ColorOutput $Cyan "  Total Companies: $($companyCount.Trim())"
        Write-ColorOutput $Cyan "  Total Coaches: $($coachCount.Trim())"
    } catch {
        Write-ColorOutput $Yellow "  Could not retrieve database statistics"
    }
    
} catch {
    Write-ColorOutput $Red "❌ Test failed: $($_.Exception.Message)"
    exit 1
}
