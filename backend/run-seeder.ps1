# Quick Seed Script with PowerShell
# This script helps you seed interview data for testing

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🌱 Interview Analytics Data Seeder" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if TEST_USER_ID is set
if (-not $env:TEST_USER_ID) {
    Write-Host "❌ TEST_USER_ID not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 How to get your User ID:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open browser: " -NoNewline
    Write-Host "http://localhost:5173" -ForegroundColor Cyan
    Write-Host "2. Login to your account"
    Write-Host "3. Press F12 (Dev Tools)"
    Write-Host "4. Go to Console tab"
    Write-Host "5. Type: " -NoNewline
    Write-Host 'localStorage.getItem("__clerk_db_jwt")' -ForegroundColor Green
    Write-Host "6. Copy the token"
    Write-Host "7. Go to: " -NoNewline
    Write-Host "https://jwt.io" -ForegroundColor Cyan
    Write-Host "8. Paste token and copy the 'sub' field"
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Yellow
    Write-Host '  $env:TEST_USER_ID = "user_YOUR_ID_HERE"' -ForegroundColor Green
    Write-Host '  .\run-seeder.ps1' -ForegroundColor Green
    Write-Host ""
    Write-Host "Or in one line:" -ForegroundColor Yellow
    Write-Host '  $env:TEST_USER_ID="user_YOUR_ID"; node test_scripts/seed-interview-data.js' -ForegroundColor Green
    Write-Host ""
    exit 1
}

Write-Host "✅ User ID found: $env:TEST_USER_ID" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting data seeder..." -ForegroundColor Yellow
Write-Host ""

# Run the seeder
node test_scripts/seed-interview-data.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  🎉 SUCCESS! Data seeded successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 View your analytics at:" -ForegroundColor Yellow
    Write-Host "   http://localhost:5173/interviews/analytics" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✨ You should now see:" -ForegroundColor Yellow
    Write-Host "   • 25 interviews across multiple companies"
    Write-Host "   • ~19 completed interviews (75%)"
    Write-Host "   • Various interview types and industries"
    Write-Host "   • 8 mock interview sessions"
    Write-Host "   • Full analytics across all 5 tabs"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error occurred. Check the output above." -ForegroundColor Red
    Write-Host ""
}
