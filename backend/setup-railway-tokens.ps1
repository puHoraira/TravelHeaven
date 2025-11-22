# Railway Token Setup Script
# This script helps you quickly update railway tokens

Write-Host "🚂 Railway API Token Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

$configFile = ".env.railway"

if (!(Test-Path $configFile)) {
    Write-Host "Creating .env.railway file..." -ForegroundColor Yellow
    Copy-Item ".env.railway.example" $configFile
}

Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "1. Open https://eticket.railway.gov.bd/ and login"
Write-Host "2. Press F12 → Network tab"
Write-Host "3. Search for trains"
Write-Host "4. Find 'search-trips-v2' request"
Write-Host "5. Copy: Authorization, x-device-id, x-device-key"
Write-Host ""

Write-Host "Enter Bearer Token (without 'Bearer ' prefix):" -ForegroundColor Yellow
$bearerToken = Read-Host

Write-Host "Enter Device ID:" -ForegroundColor Yellow
$deviceId = Read-Host

Write-Host "Enter Device Key:" -ForegroundColor Yellow
$deviceKey = Read-Host

# Create config content
$content = @"
# Railway API Configuration
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

RAILWAY_BEARER_TOKEN=$bearerToken
RAILWAY_DEVICE_ID=$deviceId
RAILWAY_DEVICE_KEY=$deviceKey
"@

# Write to file
$content | Out-File -FilePath $configFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Railway tokens updated successfully!" -ForegroundColor Green
Write-Host "📝 Config saved to: $configFile" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Please restart your backend server for changes to take effect" -ForegroundColor Yellow
Write-Host ""
