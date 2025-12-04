#!/bin/bash
# Create GitHub repository using API
REPO_NAME="ai-platforms-directory"
DESCRIPTION="AI Platforms Directory - 693+ curated AI tools with search, filtering, and monetization"

# Get GitHub token from git credential helper
echo "Creating GitHub repository: $REPO_NAME"
echo "Description: $DESCRIPTION"
echo ""
echo "Please create the repository manually at:"
echo "https://github.com/new"
echo ""
echo "Repository name: $REPO_NAME"
echo "Description: $DESCRIPTION"
echo "Public repository"
echo ""
echo "After creating, run:"
echo "git remote set-url origin https://github.com/VladSF415/$REPO_NAME.git"
echo "git push -u origin master"
