#!/bin/bash

# Railway Deployment Script
# Run this script to deploy to Railway in one command

set -e

echo "🚂 AI Platforms Directory - Railway Deployment"
echo "=============================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

echo ""
echo "✅ Authenticated with Railway"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo ""
echo "🚀 Deploying to Railway..."
echo ""

# Initialize Railway project if needed
if [ ! -f "railway.toml" ]; then
    echo "Initializing Railway project..."
    railway init
fi

# Deploy
railway up

echo ""
echo "=============================================="
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables (if needed):"
echo "   railway variables set DEEPSEEK_API_KEY=your-key"
echo ""
echo "2. Open your deployed site:"
echo "   railway open"
echo ""
echo "3. View logs:"
echo "   railway logs"
echo ""
