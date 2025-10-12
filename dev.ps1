# Travel Heaven - Development Helper Script

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('setup', 'start', 'stop', 'clean', 'rebuild', 'help')]
    [string]$Command = 'help'
)

function Show-Header {
    param([string]$Title)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "$Title" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Show-Help {
    Show-Header "Travel Heaven - Development Commands"
    
    Write-Host "Usage: .\dev.ps1 <command>`n" -ForegroundColor Yellow
    
    Write-Host "Available commands:" -ForegroundColor White
    Write-Host "  setup    - Initial setup (install dependencies, create .env)" -ForegroundColor Gray
    Write-Host "  start    - Start backend and frontend servers" -ForegroundColor Gray
    Write-Host "  stop     - Stop all running servers" -ForegroundColor Gray
    Write-Host "  clean    - Clean node_modules and lock files" -ForegroundColor Gray
    Write-Host "  rebuild  - Clean and reinstall everything" -ForegroundColor Gray
    Write-Host "  help     - Show this help message" -ForegroundColor Gray
    
    Write-Host "`nExamples:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 setup" -ForegroundColor Gray
    Write-Host "  .\dev.ps1 start" -ForegroundColor Gray
    Write-Host "  .\dev.ps1 rebuild" -ForegroundColor Gray
}

function Invoke-Setup {
    Show-Header "Setting Up Travel Heaven"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Node.js not found!" -ForegroundColor Red
        Write-Host "  Please install from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Backend setup
    Write-Host "`nSetting up backend..." -ForegroundColor Yellow
    Push-Location backend
    
    if (!(Test-Path ".env")) {
        Copy-Item .env.example .env
        Write-Host "✓ Created backend/.env" -ForegroundColor Green
    }
    
    Write-Host "Installing backend dependencies..." -ForegroundColor Gray
    npm install --silent
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend installation failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
    # Frontend setup
    Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
    Push-Location frontend
    
    if (!(Test-Path ".env")) {
        Copy-Item .env.example .env
        Write-Host "✓ Created frontend/.env" -ForegroundColor Green
    }
    
    Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
    npm install --silent
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend installation failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
    Show-Header "Setup Complete!"
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Edit backend/.env with your MongoDB URI" -ForegroundColor White
    Write-Host "2. Run: .\dev.ps1 start" -ForegroundColor White
}

function Invoke-Start {
    Show-Header "Starting Travel Heaven"
    
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    try {
        $mongoStatus = mongo --eval "db.adminCommand('ping')" --quiet 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ MongoDB is running" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ MongoDB check failed. Starting MongoDB..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "mongod"
        Start-Sleep -Seconds 3
    }
    
    Write-Host "`nStarting Backend..." -ForegroundColor Yellow
    $backendPath = Join-Path $PSScriptRoot "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"
    Start-Sleep -Seconds 2
    
    Write-Host "Starting Frontend..." -ForegroundColor Yellow
    $frontendPath = Join-Path $PSScriptRoot "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"
    
    Show-Header "Services Started!"
    Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nPress Ctrl+C in each terminal to stop." -ForegroundColor Yellow
}

function Invoke-Stop {
    Show-Header "Stopping Travel Heaven"
    
    Write-Host "Stopping Node processes..." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✓ Stopped all Node processes" -ForegroundColor Green
    
    Write-Host "`nNote: MongoDB may still be running." -ForegroundColor Yellow
    Write-Host "To stop MongoDB, close its terminal window." -ForegroundColor Gray
}

function Invoke-Clean {
    Show-Header "Cleaning Project"
    
    $confirm = Read-Host "This will delete all node_modules. Continue? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        return
    }
    
    Write-Host "`nCleaning backend..." -ForegroundColor Yellow
    if (Test-Path "backend/node_modules") {
        Remove-Item -Recurse -Force backend/node_modules
        Write-Host "✓ Removed backend/node_modules" -ForegroundColor Green
    }
    if (Test-Path "backend/package-lock.json") {
        Remove-Item -Force backend/package-lock.json
        Write-Host "✓ Removed backend/package-lock.json" -ForegroundColor Green
    }
    
    Write-Host "`nCleaning frontend..." -ForegroundColor Yellow
    if (Test-Path "frontend/node_modules") {
        Remove-Item -Recurse -Force frontend/node_modules
        Write-Host "✓ Removed frontend/node_modules" -ForegroundColor Green
    }
    if (Test-Path "frontend/package-lock.json") {
        Remove-Item -Force frontend/package-lock.json
        Write-Host "✓ Removed frontend/package-lock.json" -ForegroundColor Green
    }
    
    Write-Host "`n✓ Clean complete!" -ForegroundColor Green
}

function Invoke-Rebuild {
    Show-Header "Rebuilding Project"
    
    Invoke-Clean
    Write-Host "`n"
    Invoke-Setup
}

# Main execution
switch ($Command) {
    'setup' { Invoke-Setup }
    'start' { Invoke-Start }
    'stop' { Invoke-Stop }
    'clean' { Invoke-Clean }
    'rebuild' { Invoke-Rebuild }
    'help' { Show-Help }
    default { Show-Help }
}
