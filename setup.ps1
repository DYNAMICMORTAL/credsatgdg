# Quick Setup Script for Windows

Write-Host "🎓 College Certificate System - Setup" -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Write-Host "Setting up Backend..." -ForegroundColor Yellow
cd college-cert-backend

# Create virtual environment
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file - PLEASE EDIT IT WITH YOUR SUPABASE CREDENTIALS" -ForegroundColor Yellow
}

cd ..

# Frontend Setup
Write-Host ""
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
cd college-cert-frontend

# Install dependencies
npm install
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file - PLEASE EDIT IT" -ForegroundColor Yellow
}

cd ..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit college-cert-backend/.env with Supabase database URL"
Write-Host "2. Edit college-cert-frontend/.env with backend URL"
Write-Host "3. Run backend: cd college-cert-backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload"
Write-Host "4. Run frontend: cd college-cert-frontend && npm run dev"
Write-Host ""
