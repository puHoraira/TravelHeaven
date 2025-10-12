# Travel Heaven Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Travel Heaven Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start a service in a new window
function Start-ServiceInNewWindow {
    param (
        [string]$Path,
        [string]$Command,
        [string]$Title
    )
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '$Title' -ForegroundColor Cyan; $Command"
}

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoStatus = mongo --eval "db.adminCommand('ping')" --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ MongoDB might not be running. Starting MongoDB..." -ForegroundColor Yellow
        Start-ServiceInNewWindow -Path $PSScriptRoot -Command "mongod" -Title "MongoDB Server"
        Start-Sleep -Seconds 3
    }
} catch {
    Write-Host "⚠ Could not check MongoDB status" -ForegroundColor Yellow
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-ServiceInNewWindow -Path $backendPath -Command "npm run dev" -Title "Backend Server (Port 5000)"
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-ServiceInNewWindow -Path $frontendPath -Command "npm run dev" -Title "Frontend Server (Port 3000)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the new terminal windows for server logs." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop the servers." -ForegroundColor Yellow
