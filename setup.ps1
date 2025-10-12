# Travel Heaven Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Travel Heaven - Tourist Helper Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoVersion = mongod --version
    Write-Host "✓ MongoDB installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB not found. Install from https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host "  Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend setup
Set-Location backend

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created. Please edit it with your MongoDB URI and JWT secret." -ForegroundColor Green
    Write-Host "  Run: notepad .env" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Backend installation failed" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Frontend setup
Set-Location frontend

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend installation failed" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend/.env with your MongoDB URI and JWT secret:" -ForegroundColor White
Write-Host "   notepad backend\.env" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start MongoDB (if running locally):" -ForegroundColor White
Write-Host "   mongod" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the backend (in a new terminal):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the frontend (in another terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
