# LiveBaz Project Setup Script
# This script will set up everything you need to run the project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LiveBaz Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create .env file for server
Write-Host "[1/6] Creating server .env file..." -ForegroundColor Yellow

$envContent = @"
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=livebaz
MYSQL_USER=root
MYSQL_PASSWORD=

# JWT Secret (for authentication)
JWT_SECRET=livebaz_super_secret_jwt_key_2024_production_ready

# Server Port
PORT=3000

# Admin User (for migration script)
ADMIN_EMAIL=admin@livebaz.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=Admin

# API Football Key (you already have this)
APIFOOTBALL_KEY=8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b
"@

Set-Content -Path ".\server\.env" -Value $envContent
Write-Host "[OK] Server .env file created" -ForegroundColor Green
Write-Host ""

# Step 2: Install server dependencies
Write-Host "[2/6] Installing server dependencies..." -ForegroundColor Yellow
Set-Location -Path ".\server"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Server dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Failed to install server dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Install frontend dependencies
Write-Host "[3/6] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "..\Frontend"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Check MySQL connection
Write-Host "[4/6] Checking MySQL setup..." -ForegroundColor Yellow
Write-Host "Please ensure MySQL is running on your system." -ForegroundColor Cyan
Write-Host "Default configuration:" -ForegroundColor Cyan
Write-Host "  - Host: localhost" -ForegroundColor White
Write-Host "  - Port: 3306" -ForegroundColor White
Write-Host "  - User: root" -ForegroundColor White
Write-Host "  - Password: (empty)" -ForegroundColor White
Write-Host ""
Write-Host "If your MySQL password is different, please update server\.env file" -ForegroundColor Yellow
Write-Host ""

# Step 5: Create database and run migrations
Write-Host "[5/6] Setting up database..." -ForegroundColor Yellow
Set-Location -Path "..\server"

# Create database
Write-Host "Creating database 'livebaz'..." -ForegroundColor Cyan
$mysqlCmd = "CREATE DATABASE IF NOT EXISTS livebaz;"
mysql -u root -e $mysqlCmd 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database created/verified" -ForegroundColor Green
}
else {
    Write-Host "[WARNING] Could not verify database. Please create it manually:" -ForegroundColor Yellow
    Write-Host "  mysql -u root -e 'CREATE DATABASE livebaz;'" -ForegroundColor White
}
Write-Host ""

# Run migrations
Write-Host "Running migrations and creating admin user..." -ForegroundColor Cyan
node src/migrations/add-admin-features.js --create-admin
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migrations completed and admin user created" -ForegroundColor Green
}
else {
    Write-Host "[WARNING] Migrations may need to be run manually after starting the server" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Final instructions
Set-Location -Path ".."
Write-Host "[6/6] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Server dependencies installed" -ForegroundColor Green
Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
Write-Host "[OK] Environment files configured" -ForegroundColor Green
Write-Host "[OK] Database setup initiated" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  How to Run the Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the Backend Server:" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the Frontend (in a new terminal):" -ForegroundColor Yellow
Write-Host "   cd Frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Admin Panel Access" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Login URL: http://localhost:5173/admin/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@livebaz.com" -ForegroundColor White
Write-Host "  Password: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: If you encounter any MySQL connection errors," -ForegroundColor Yellow
Write-Host "please update the MYSQL_PASSWORD in server\.env file" -ForegroundColor Yellow
Write-Host ""
