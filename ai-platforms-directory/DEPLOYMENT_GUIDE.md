# Multi-Platform Deployment Guide

Complete guide for deploying AI Platforms Directory to GitHub, Firebase, and Railway.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Git installed
- ✅ npm or yarn package manager

## 🚀 Quick Deploy

### Windows (PowerShell)
```powershell
cd ai-platforms-directory
.\deploy-all.ps1
```

### Mac/Linux (Bash)
```bash
cd ai-platforms-directory
chmod +x deploy-all.sh
./deploy-all.sh
```

---

## 1️⃣ GitHub Setup

### First-Time Setup

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Repository name: `ai-platforms-directory` (or your choice)
   - Set to Public or Private
   - **Don't** initialize with README (we already have content)
   - Click "Create repository"

2. **Connect Local Repository**
   ```bash
   # In ai-platforms-directory folder
   git remote add origin https://github.com/YOUR-USERNAME/ai-platforms-directory.git
   git branch -M main
   git push -u origin main
   ```

3. **Verify Connection**
   ```bash
   git remote -v
   # Should show:
   # origin  https://github.com/YOUR-USERNAME/ai-platforms-directory.git (fetch)
   # origin  https://github.com/YOUR-USERNAME/ai-platforms-directory.git (push)
   ```

### Deploy Updates
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 2️⃣ Firebase Hosting Setup

Firebase is already configured with project ID: `ai-platforms-directory`

### First-Time Setup

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```
   - Opens browser for Google authentication
   - Login with Google account

3. **Verify Configuration**
   ```bash
   firebase projects:list
   ```
   - Should show `ai-platforms-directory` project

4. **Deploy to Firebase**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Production URL
After deployment, your site will be live at:
- **Primary:** https://ai-platforms-directory.web.app
- **Custom Domain:** https://ai-platforms-directory.firebaseapp.com

### Custom Domain Setup (Optional)
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Firebase handles SSL certificates automatically

### Deploy Updates
```bash
npm run build
firebase deploy --only hosting
```

---

## 3️⃣ Railway Deployment

Railway configuration is in `railway.json`

### First-Time Setup

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```
   - Opens browser for authentication
   - Login with GitHub account (recommended)

3. **Link Project** (if not already linked)
   ```bash
   railway link
   ```
   - Select existing project or create new one

4. **Deploy to Railway**
   ```bash
   npm run build
   railway up
   ```

### Production URL
Railway will provide a URL like:
- https://your-project.up.railway.app

### Custom Domain Setup (Optional)
1. Go to Railway Dashboard > Settings
2. Add custom domain
3. Configure DNS (A or CNAME record)
4. Railway handles SSL automatically

### Deploy Updates
```bash
npm run build
railway up
```

### Environment Variables
Railway automatically handles:
- `NODE_ENV=production`
- `PORT` (assigned dynamically)

To add custom variables:
```bash
railway variables set VARIABLE_NAME=value
```

---

## 📦 Deployment Scripts Reference

### package.json Scripts

```json
{
  "build": "tsc && vite build",
  "deploy:railway": "npm run build && railway up",
  "deploy:vercel": "npm run build && vercel --prod",
  "deploy:firebase": "npm run build && firebase deploy --only hosting"
}
```

### Manual Deployment Commands

**Build Production Bundle:**
```bash
npm run build
```

**Deploy to specific platform:**
```bash
npm run deploy:firebase   # Firebase only
npm run deploy:railway    # Railway only
```

---

## 🔧 Troubleshooting

### Firebase Issues

**Error: "Not logged in"**
```bash
firebase logout
firebase login
```

**Error: "Project not found"**
- Verify `.firebaserc` contains correct project ID
- Run `firebase use --add` to select project

**Build errors:**
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Railway Issues

**Error: "Not logged in"**
```bash
railway logout
railway login
```

**Deployment fails:**
- Check `railway.json` configuration
- Verify build command succeeds locally
- Check Railway dashboard logs

**Port binding issues:**
- Railway assigns `PORT` environment variable
- Ensure server uses `process.env.PORT`

### GitHub Issues

**Error: "Remote already exists"**
```bash
git remote remove origin
git remote add origin YOUR-NEW-URL
```

**Push rejected:**
```bash
git pull --rebase origin main
git push origin main
```

---

## 🎯 Deployment Workflow

### Recommended Workflow

1. **Development**
   ```bash
   npm run dev              # Local development server
   ```

2. **Test Build**
   ```bash
   npm run build            # Test production build
   npm run preview          # Preview production build
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

4. **Deploy All Platforms**
   ```bash
   # Windows
   .\deploy-all.ps1

   # Mac/Linux
   ./deploy-all.sh
   ```

### Individual Platform Deployment

**GitHub Only:**
```bash
git push origin main
```

**Firebase Only:**
```bash
npm run build
firebase deploy --only hosting
```

**Railway Only:**
```bash
npm run build
railway up
```

---

## 📊 Monitoring & Analytics

### Firebase Analytics
- Access Firebase Console > Analytics
- View real-time user activity
- Track page views and engagement

### Railway Monitoring
- Railway Dashboard > Metrics
- View CPU, memory, and network usage
- Check deployment logs

### GitHub Actions (Optional)
Set up automated deployments on push:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase & Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm install
      - run: npm run build

      # Firebase Deployment
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: ai-platforms-directory

      # Railway Deployment
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ai-platforms-directory
```

---

## 🎉 Success Checklist

After deployment, verify:

- ✅ GitHub repository shows latest commits
- ✅ Firebase URL is accessible: https://ai-platforms-directory.web.app
- ✅ Railway URL is accessible
- ✅ All 18 healthcare AI platforms visible
- ✅ Alternatives pages load correctly
- ✅ Comparison pages load correctly
- ✅ Blog posts load correctly
- ✅ Search functionality works
- ✅ Category filtering works
- ✅ Analytics tracking works (if configured)

---

## 📞 Support

### Firebase Support
- Documentation: https://firebase.google.com/docs/hosting
- Community: https://firebase.google.com/support

### Railway Support
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway

### GitHub Support
- Documentation: https://docs.github.com
- Community: https://github.community

---

## 🔄 Rollback Instructions

### Firebase Rollback
```bash
firebase hosting:rollback
```

### Railway Rollback
1. Go to Railway Dashboard
2. Click "Deployments"
3. Select previous successful deployment
4. Click "Redeploy"

### GitHub Rollback
```bash
git revert HEAD
git push origin main
```

---

## 📈 Healthcare AI Content Deployed

Your deployment includes:

- **18 Verified Healthcare AI Platforms**
  - Aidoc, Viz.ai, PathAI, Tempus, Butterfly Network
  - Nuance, Epic Systems, GE Healthcare, Siemens, Philips
  - IBM Watson Health, Owkin, Insitro, Recursion
  - Corti, HeartFlow, Arterys, Nanox AI

- **18 Alternatives Pages**
- **10 Strategic Comparison Pages**
- **3 E-E-A-T Compliant Blog Posts**
  - AI in Medical Imaging & Radiology
  - Drug Discovery & Innovation
  - Clinical Workflow Optimization

- **Total Database:** 1,056+ AI platforms

All content verified against official sources!

---

**Last Updated:** 2026-01-03
**Version:** 1.0.0
