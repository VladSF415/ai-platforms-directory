# Railway Deployment Script for Windows PowerShell
# Run this script to deploy to Railway in one command

$ErrorActionPreference = "Stop"

Write-Host "🚂 AI Platforms Directory - Railway Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}

# Check if logged in
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Cyan
try {
    railway whoami | Out-Null
    Write-Host "✅ Authenticated with Railway" -ForegroundColor Green
} catch {
    Write-Host "Please login to Railway:" -ForegroundColor Yellow
    railway login
}

Write-Host ""

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Cyan
Write-Host ""

# Initialize Railway project if needed
if (-not (Test-Path "railway.toml")) {
    Write-Host "Initializing Railway project..." -ForegroundColor Yellow
    railway init
}

# Deploy
railway up

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set environment variables (if needed):"
Write-Host "   railway variables set DEEPSEEK_API_KEY=your-key"
Write-Host ""
Write-Host "2. Open your deployed site:"
Write-Host "   railway open"
Write-Host ""
Write-Host "3. View logs:"
Write-Host "   railway logs"
Write-Host ""
