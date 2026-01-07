# Deployment Guide

This guide covers deploying the AI Platforms Directory to various hosting platforms.

## Prerequisites

- Node.js 20+ installed
- Build the project: `npm run build`
- All environment variables configured

---

## Option 1: Railway (Recommended - Easiest)

Railway is the simplest option for full-stack apps with backend APIs.

### Steps:

1. **Create Railway account**: https://railway.app/

2. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

3. **Login to Railway**:
   ```bash
   railway login
   ```

4. **Initialize project**:
   ```bash
   railway init
   ```

5. **Set environment variables** (if using AI content generation):
   ```bash
   railway variables set DEEPSEEK_API_KEY=your-key-here
   railway variables set NODE_ENV=production
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

7. **Get your URL**:
   ```bash
   railway open
   ```

### Railway Configuration

The `railway.json` file is already configured with:
- Build command: `npm install && npm run build`
- Start command: `node server.js`
- Auto-restart on failure

---

## Option 2: Firebase Hosting + Functions

Firebase is great for static sites with serverless functions.

### Steps:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Create Firebase project**: https://console.firebase.google.com/

4. **Initialize Firebase**:
   ```bash
   firebase init
   ```
   Select:
   - ✅ Hosting
   - ✅ Functions
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Functions language: `JavaScript`

5. **Move server to Firebase Functions**:
   ```bash
   # Create functions directory structure
   mkdir -p functions
   cp server.js functions/index.js
   cp -r platforms.json landing-content functions/
   ```

6. **Update functions/index.js** to export for Firebase:
   ```javascript
   const functions = require('firebase-functions');
   // ... existing server code ...
   exports.api = functions.https.onRequest(fastify);
   ```

7. **Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

---

## Option 3: Vercel (Frontend + API Routes)

Vercel is excellent for React apps with serverless API routes.

### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   npm run build
   vercel --prod
   ```

4. **Configure environment variables** in Vercel dashboard:
   - Go to: https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add: `DEEPSEEK_API_KEY` (if needed)

### Vercel Configuration

The `vercel.json` file is configured with:
- Static build from `dist/`
- API routes from `server.js`
- SPA rewrites to `/index.html`

---

## Option 4: GitHub Pages (Static Only)

GitHub Pages is free but only supports static files (no backend API).

### Steps:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Install gh-pages**:
   ```bash
   npm install -D gh-pages
   ```

3. **Add deploy script to package.json**:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: `gh-pages` branch
   - Your site will be at: `https://yourusername.github.io/ai-platforms-directory/`

**⚠️ Note**: GitHub Pages doesn't support backend APIs. You'll need to:
- Use Firebase Functions/Vercel for API endpoints
- Or embed platform data directly in the frontend

---

## Option 5: Docker + Any Cloud Platform

Deploy using Docker to AWS, Google Cloud, Azure, DigitalOcean, etc.

### Steps:

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Build Docker image**:
   ```bash
   docker build -t ai-platforms-directory .
   ```

3. **Run locally to test**:
   ```bash
   docker run -p 3000:3000 ai-platforms-directory
   ```

4. **Deploy to your cloud provider**:
   - **AWS ECS**: Push to ECR, create ECS service
   - **Google Cloud Run**: `gcloud run deploy`
   - **Azure Container Apps**: `az containerapp create`
   - **DigitalOcean App Platform**: Connect GitHub repo

---

## Environment Variables

Set these environment variables in your hosting platform:

```bash
# Optional - for AI content generation
DEEPSEEK_API_KEY=your-deepseek-api-key

# Production environment
NODE_ENV=production

# Optional - custom port (Railway/Vercel auto-detect)
PORT=3000
```

---

## Pre-Deployment Checklist

Before deploying, ensure:

- ✅ `npm run build` completes successfully
- ✅ All TypeScript errors resolved
- ✅ Landing page content generated (or pages work without content)
- ✅ Environment variables configured
- ✅ `platforms.json` file exists in project root
- ✅ Server listens on `process.env.PORT` or port 3000
- ✅ All routes properly configured for SPA

---

## Testing Deployment Locally

Before deploying, test production build locally:

```bash
# Build the project
npm run build

# Start the production server
NODE_ENV=production node server.js

# Visit http://localhost:3000
```

Test these routes:
- ✅ Homepage: http://localhost:3000/
- ✅ How to Choose: http://localhost:3000/how-to-choose-ai-platforms
- ✅ ML Tools: http://localhost:3000/machine-learning-tools-directory
- ✅ NLP Tools: http://localhost:3000/natural-language-processing-tools
- ✅ Computer Vision: http://localhost:3000/computer-vision-platforms
- ✅ Enterprise AI: http://localhost:3000/enterprise-ai-solutions
- ✅ API: http://localhost:3000/api/platforms

---

## Recommended Deployment Strategy

**For this project, I recommend Railway** because:
1. ✅ Supports both frontend + backend in one deployment
2. ✅ Automatic HTTPS and custom domains
3. ✅ Zero configuration needed (uses `railway.json`)
4. ✅ Free tier available ($5 credit/month)
5. ✅ Auto-deploys from GitHub
6. ✅ Built-in environment variables management
7. ✅ Handles Node.js server perfectly

### Quick Railway Deploy:

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Deploy (one command!)
railway up

# Your site is live! 🎉
railway open
```

---

## GitHub Actions CI/CD

The `.github/workflows/deploy.yml` file is configured for automatic deployments on push to `main` branch.

### Setup:

1. **Add secrets to GitHub repo**:
   - Settings → Secrets and variables → Actions
   - Add: `RAILWAY_TOKEN` or `FIREBASE_SERVICE_ACCOUNT`

2. **Uncomment deployment step** in `.github/workflows/deploy.yml`

3. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

4. **Automatic deployment** will run on every push!

---

## Troubleshooting

### Build fails with TypeScript errors
```bash
npm run build
# Fix any errors shown, then rebuild
```

### Server won't start in production
- Check `NODE_ENV=production` is set
- Verify `dist/` folder exists
- Check port is set to `process.env.PORT`

### Routes return 404
- Ensure SPA rewrites are configured
- Check `server.js` serves `index.html` for all routes
- Verify `dist/index.html` exists

### API endpoints not working
- Check backend server is running
- Verify `/api/*` routes are proxied to server
- Check CORS settings if frontend/backend on different domains

---

## Post-Deployment

After deployment:

1. ✅ Test all 5 landing pages
2. ✅ Test interactive components (quiz, calculator, etc.)
3. ✅ Verify SEO meta tags (use https://metatags.io)
4. ✅ Check mobile responsiveness
5. ✅ Submit sitemap to Google Search Console
6. ✅ Set up analytics tracking
7. ✅ Monitor performance with Lighthouse

---

## Custom Domain Setup

### Railway:
```bash
railway domain
# Follow prompts to add custom domain
```

### Vercel:
- Dashboard → Project → Settings → Domains
- Add your domain and configure DNS

### Firebase:
```bash
firebase hosting:channel:deploy production --expires 30d
```

---

## Support

For deployment issues:
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs/hosting
- GitHub Actions: https://docs.github.com/actions
