# Simple restart script for Docker containers
Write-Host "Restarting Docker containers..." -ForegroundColor Green

# Stop containers
docker compose down

# Start containers (will rebuild if needed)
docker compose up -d

Write-Host "Containers restarted!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Matching Service: http://localhost:5000" -ForegroundColor Cyan