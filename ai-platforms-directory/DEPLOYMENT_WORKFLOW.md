# Deployment Workflow - AI Platforms Directory

## Important: Claude Handles All Deployments

**For Future Claude Sessions:** You (Claude) are responsible for handling all deployments. The user does not manually deploy - you do it.

## How Deployment Works

### Standard Workflow (Claude Does This):

1. **Make code changes** in `/home/geras/ai-platforms-directory`
2. **Test locally** (optional): `npm run dev`
3. **Commit changes**:
   ```bash
   cd /home/geras/ai-platforms-directory
   git add .
   git commit -m "FEAT: Description of changes

   🤖 Generated with Claude Code"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin master
   ```
5. **Railway auto-deploys** - No manual deployment needed!

## Railway Auto-Deployment

- **GitHub Repo**: https://github.com/VladSF415/ai-platforms-directory
- **Railway Service**: ai-platforms-directory-production
- **Live URL**: https://ai-platforms-directory-production.up.railway.app
- **Auto-Deploy**: Enabled ✓ (deploys automatically on every push to master)

When you push to GitHub, Railway automatically:
1. Detects the new commit
2. Runs `npm install`
3. Runs `npm run build`
4. Deploys the new version
5. Updates the live site (usually within 1-2 minutes)

## Verification After Deployment

After pushing, you can verify deployment:

```bash
# Check if latest commit is deployed
curl -s https://ai-platforms-directory-production.up.railway.app | head -20

# Check specific features (example: Google Analytics)
curl -s https://ai-platforms-directory-production.up.railway.app | grep "G-87QJXFEQQD"
```

## Important Notes

1. **You always handle deployment** - Don't ask the user to push or deploy
2. **Commit messages should be descriptive** and include "🤖 Generated with Claude Code"
3. **Test before pushing** if making significant changes
4. **Railway auto-deploys** - No manual Railway CLI commands needed
5. **Wait 1-2 minutes** for Railway to build and deploy after pushing

## Project Structure

This is a **separate project** from MegaBot:
- MegaBot: `/home/geras/MEGABOT` (Telegram bot, PostgreSQL, different Railway service)
- AI Platforms Directory: `/home/geras/ai-platforms-directory` (React app, static JSON, this service)

They are completely independent services with separate GitHub repos and Railway deployments.

## Current Status

- **693 platforms** in directory
- **Google Analytics**: G-87QJXFEQQD (tracking live)
- **Platform detail pages**: Working ✓
- **Categorization**: Fixed and accurate ✓
- **Monetization features**: Implemented ✓

## Domain (Pending User Action)

- **Current URL**: https://ai-platforms-directory-production.up.railway.app
- **Target Domain**: aiplatformslist.com
- **Status**: User needs to update DNS records in Namecheap to point to Railway
- **Your Role**: When user is ready, help them configure DNS, but they must make the changes in their domain registrar

## Summary for Future Sessions

When working on the AI Platforms Directory:
1. Make your changes
2. Commit with descriptive messages
3. Push to GitHub
4. Verify deployment after 1-2 minutes
5. Don't ask user to deploy - you handle it!
