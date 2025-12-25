# LiveBaz Project Startup Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting LiveBaz Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PWD\server
    npm run dev
}

Write-Host "[OK] Backend server starting..." -ForegroundColor Green
Write-Host "     Backend URL: http://localhost:3000" -ForegroundColor White
Write-Host ""

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Function to start frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PWD\Frontend
    npm run dev
}

Write-Host "[OK] Frontend server starting..." -ForegroundColor Green
Write-Host "     Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers Running" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:   http://localhost:3000" -ForegroundColor Yellow
Write-Host "Admin:     http://localhost:5173/admin/login" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Email:    admin@livebaz.com" -ForegroundColor White
Write-Host "  Password: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red
Write-Host ""

# Keep the script running and show output
try {
    while ($true) {
        # Receive output from jobs
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}
finally {
    # Cleanup on exit
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob, $frontendJob
    Remove-Job -Job $backendJob, $frontendJob
    Write-Host "Servers stopped." -ForegroundColor Green
}
