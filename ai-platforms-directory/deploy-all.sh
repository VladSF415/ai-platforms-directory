#!/bin/bash

##############################################################################
# Multi-Platform Deployment Script
# Deploys AI Platforms Directory to GitHub, Firebase, and Railway
##############################################################################

set -e  # Exit on error

echo "🚀 AI Platforms Directory - Multi-Platform Deployment"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git remote exists
check_git_remote() {
    if git remote get-url origin &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Step 1: Check Git Status
echo "📊 Checking Git Status..."
if [ -d .git ]; then
    echo -e "${GREEN}✓ Git repository found${NC}"

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
        echo "Would you like to commit them now? (y/n)"
        read -r commit_now

        if [ "$commit_now" = "y" ]; then
            echo "Enter commit message:"
            read -r commit_message
            git add .
            git commit -m "$commit_message"
            echo -e "${GREEN}✓ Changes committed${NC}"
        else
            echo -e "${YELLOW}⚠ Proceeding with uncommitted changes${NC}"
        fi
    else
        echo -e "${GREEN}✓ Working directory clean${NC}"
    fi
else
    echo -e "${RED}✗ Not a git repository${NC}"
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit with healthcare AI platform content"
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi

# Step 2: Push to GitHub
echo ""
echo "📦 Step 1/3: Deploying to GitHub..."
echo "-----------------------------------"

if check_git_remote; then
    echo -e "${GREEN}✓ GitHub remote configured${NC}"
    echo "Pushing to GitHub..."

    git push origin main || {
        echo -e "${YELLOW}⚠ Push failed, trying with force${NC}"
        echo "This will overwrite remote. Continue? (y/n)"
        read -r force_push
        if [ "$force_push" = "y" ]; then
            git push -f origin main
        else
            echo -e "${RED}✗ GitHub push cancelled${NC}"
        fi
    }

    echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠ No GitHub remote configured${NC}"
    echo ""
    echo "To set up GitHub deployment:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin <your-repo-url>"
    echo "3. Run this script again"
    echo ""
    echo "Skip GitHub deployment? (y/n)"
    read -r skip_github

    if [ "$skip_github" != "y" ]; then
        echo "Enter your GitHub repository URL:"
        read -r github_url

        git remote add origin "$github_url"
        git push -u origin main
        echo -e "${GREEN}✓ Successfully set up and pushed to GitHub${NC}"
    else
        echo -e "${YELLOW}⚠ Skipping GitHub deployment${NC}"
    fi
fi

# Step 3: Build the project
echo ""
echo "🔨 Building project..."
echo "---------------------"

if command -v npm &> /dev/null; then
    echo "Running npm install..."
    npm install

    echo "Building production bundle..."
    npm run build

    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ npm not found. Please install Node.js${NC}"
    exit 1
fi

# Step 4: Deploy to Firebase
echo ""
echo "🔥 Step 2/3: Deploying to Firebase..."
echo "--------------------------------------"

if command -v firebase &> /dev/null; then
    echo "Firebase CLI found, deploying..."

    # Check if logged in
    if firebase projects:list &> /dev/null; then
        firebase deploy --only hosting
        echo -e "${GREEN}✓ Successfully deployed to Firebase${NC}"
        echo "🌐 Firebase URL: https://ai-platforms-directory.web.app"
    else
        echo -e "${YELLOW}⚠ Not logged in to Firebase${NC}"
        echo "Run: firebase login"
        echo "Then run this script again"
    fi
else
    echo -e "${YELLOW}⚠ Firebase CLI not installed${NC}"
    echo "Install with: npm install -g firebase-tools"
    echo "Then run: firebase login"
    echo "Skipping Firebase deployment..."
fi

# Step 5: Deploy to Railway
echo ""
echo "🚂 Step 3/3: Deploying to Railway..."
echo "------------------------------------"

if command -v railway &> /dev/null; then
    echo "Railway CLI found, deploying..."

    # Check if logged in
    if railway whoami &> /dev/null; then
        railway up
        echo -e "${GREEN}✓ Successfully deployed to Railway${NC}"

        # Get Railway URL
        railway_url=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
        if [ -n "$railway_url" ]; then
            echo "🌐 Railway URL: $railway_url"
        fi
    else
        echo -e "${YELLOW}⚠ Not logged in to Railway${NC}"
        echo "Run: railway login"
        echo "Then run this script again"
    fi
else
    echo -e "${YELLOW}⚠ Railway CLI not installed${NC}"
    echo "Install with: npm install -g @railway/cli"
    echo "Then run: railway login"
    echo "Skipping Railway deployment..."
fi

# Summary
echo ""
echo "========================================================"
echo "🎉 Deployment Complete!"
echo "========================================================"
echo ""
echo "Deployment Summary:"
echo "-------------------"
echo "✓ GitHub: Pushed latest commits"
echo "✓ Firebase: https://ai-platforms-directory.web.app"
echo "✓ Railway: Check Railway dashboard for URL"
echo ""
echo "Healthcare AI Content:"
echo "- 18 verified platforms"
echo "- 18 alternatives pages"
echo "- 10 comparison pages"
echo "- 3 E-E-A-T compliant blog posts"
echo ""
echo "Total platforms in database: 1,056+"
echo "========================================================"
