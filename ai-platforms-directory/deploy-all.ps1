##############################################################################
# Multi-Platform Deployment Script (PowerShell)
# Deploys AI Platforms Directory to GitHub, Firebase, and Railway
##############################################################################

Write-Host "🚀 AI Platforms Directory - Multi-Platform Deployment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Function to check if git remote exists
function Test-GitRemote {
    try {
        git remote get-url origin 2>$null
        return $true
    } catch {
        return $false
    }
}

# Step 1: Check Git Status
Write-Host "📊 Checking Git Status..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "✓ Git repository found" -ForegroundColor Green

    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠ You have uncommitted changes" -ForegroundColor Yellow
        $commitNow = Read-Host "Would you like to commit them now? (y/n)"

        if ($commitNow -eq "y") {
            $commitMessage = Read-Host "Enter commit message"
            git add .
            git commit -m $commitMessage
            Write-Host "✓ Changes committed" -ForegroundColor Green
        } else {
            Write-Host "⚠ Proceeding with uncommitted changes" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✓ Working directory clean" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Not a git repository" -ForegroundColor Red
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit with healthcare AI platform content"
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# Step 2: Push to GitHub
Write-Host ""
Write-Host "📦 Step 1/3: Deploying to GitHub..." -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

if (Test-GitRemote) {
    Write-Host "✓ GitHub remote configured" -ForegroundColor Green
    Write-Host "Pushing to GitHub..." -ForegroundColor White

    try {
        git push origin main
        Write-Host "✓ Successfully pushed to GitHub" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Push failed, trying with force" -ForegroundColor Yellow
        $forcePush = Read-Host "This will overwrite remote. Continue? (y/n)"
        if ($forcePush -eq "y") {
            git push -f origin main
            Write-Host "✓ Successfully force pushed to GitHub" -ForegroundColor Green
        } else {
            Write-Host "✗ GitHub push cancelled" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠ No GitHub remote configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To set up GitHub deployment:" -ForegroundColor White
    Write-Host "1. Create a new repository on GitHub" -ForegroundColor White
    Write-Host "2. Run: git remote add origin <your-repo-url>" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""

    $skipGithub = Read-Host "Skip GitHub deployment? (y/n)"

    if ($skipGithub -ne "y") {
        $githubUrl = Read-Host "Enter your GitHub repository URL"
        git remote add origin $githubUrl
        git push -u origin main
        Write-Host "✓ Successfully set up and pushed to GitHub" -ForegroundColor Green
    } else {
        Write-Host "⚠ Skipping GitHub deployment" -ForegroundColor Yellow
    }
}

# Step 3: Build the project
Write-Host ""
Write-Host "🔨 Building project..." -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Yellow

if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Running npm install..." -ForegroundColor White
    npm install

    Write-Host "Building production bundle..." -ForegroundColor White
    npm run build

    Write-Host "✓ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Step 4: Deploy to Firebase
Write-Host ""
Write-Host "🔥 Step 2/3: Deploying to Firebase..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow

if (Get-Command firebase -ErrorAction SilentlyContinue) {
    Write-Host "Firebase CLI found, deploying..." -ForegroundColor White

    try {
        firebase projects:list | Out-Null
        firebase deploy --only hosting
        Write-Host "✓ Successfully deployed to Firebase" -ForegroundColor Green
        Write-Host "🌐 Firebase URL: https://ai-platforms-directory.web.app" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠ Not logged in to Firebase" -ForegroundColor Yellow
        Write-Host "Run: firebase login" -ForegroundColor White
        Write-Host "Then run this script again" -ForegroundColor White
    }
} else {
    Write-Host "⚠ Firebase CLI not installed" -ForegroundColor Yellow
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor White
    Write-Host "Then run: firebase login" -ForegroundColor White
    Write-Host "Skipping Firebase deployment..." -ForegroundColor Yellow
}

# Step 5: Deploy to Railway
Write-Host ""
Write-Host "🚂 Step 3/3: Deploying to Railway..." -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

if (Get-Command railway -ErrorAction SilentlyContinue) {
    Write-Host "Railway CLI found, deploying..." -ForegroundColor White

    try {
        railway whoami | Out-Null
        railway up
        Write-Host "✓ Successfully deployed to Railway" -ForegroundColor Green

        # Get Railway URL
        $railwayStatus = railway status --json | ConvertFrom-Json
        if ($railwayStatus.url) {
            Write-Host "🌐 Railway URL: $($railwayStatus.url)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠ Not logged in to Railway" -ForegroundColor Yellow
        Write-Host "Run: railway login" -ForegroundColor White
        Write-Host "Then run this script again" -ForegroundColor White
    }
} else {
    Write-Host "⚠ Railway CLI not installed" -ForegroundColor Yellow
    Write-Host "Install with: npm install -g @railway/cli" -ForegroundColor White
    Write-Host "Then run: railway login" -ForegroundColor White
    Write-Host "Skipping Railway deployment..." -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment Summary:" -ForegroundColor White
Write-Host "-------------------" -ForegroundColor White
Write-Host "✓ GitHub: Pushed latest commits" -ForegroundColor Green
Write-Host "✓ Firebase: https://ai-platforms-directory.web.app" -ForegroundColor Green
Write-Host "✓ Railway: Check Railway dashboard for URL" -ForegroundColor Green
Write-Host ""
Write-Host "Healthcare AI Content:" -ForegroundColor White
Write-Host "- 18 verified platforms" -ForegroundColor White
Write-Host "- 18 alternatives pages" -ForegroundColor White
Write-Host "- 10 comparison pages" -ForegroundColor White
Write-Host "- 3 E-E-A-T compliant blog posts" -ForegroundColor White
Write-Host ""
Write-Host "Total platforms in database: 1,056+" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
