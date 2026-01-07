# 🚀 Quick Deploy Guide

Choose your deployment platform and follow the simple steps below.

---

## ⚡ Fastest: Railway (Recommended)

**Deploy in 3 commands:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Deploy!
npm run deploy:railway
```

That's it! Your site is live. 🎉

Get your URL:
```bash
railway open
```

**Cost**: Free tier ($5 credit/month)

---

## 🔷 Alternative: Vercel

**Deploy in 3 commands:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy!
npm run deploy:vercel
```

**Cost**: Free tier available

---

## 🔥 Alternative: Firebase

**Deploy in 4 commands:**

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize (first time only)
firebase init

# 4. Deploy!
npm run deploy:firebase
```

**Cost**: Free tier (Spark plan)

---

## 🐳 Docker Deployment

**Build and run with Docker:**

```bash
# Build the Docker image
npm run docker:build

# Run locally to test
npm run docker:run

# Visit http://localhost:3000
```

Then push to any cloud platform:
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- DigitalOcean App Platform

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

✅ **Build works**:
```bash
npm run build
```

✅ **Server runs locally**:
```bash
npm start
# Visit http://localhost:3000
```

✅ **(Optional) Generate landing page content**:
```bash
# Set your API key first
export DEEPSEEK_API_KEY=your-key-here

# Generate content for all 5 landing pages
npm run ai:landing
```

---

## 🔑 Environment Variables

If using AI content generation, set this on your platform:

```bash
# Railway
railway variables set DEEPSEEK_API_KEY=your-key

# Vercel (via dashboard)
# Go to: Settings → Environment Variables

# Firebase (via .env file in functions/)
```

---

## 🎯 What You Get

After deployment, you'll have:

✅ **Homepage** with 1,039+ AI platforms
✅ **5 SEO landing pages**:
   - `/how-to-choose-ai-platforms` (interactive quiz)
   - `/machine-learning-tools-directory` (comparison widget)
   - `/natural-language-processing-tools` (use case matcher)
   - `/computer-vision-platforms` (ROI calculator)
   - `/enterprise-ai-solutions` (readiness assessment)
✅ **Navigation** with Resources dropdown
✅ **Footer** with resource links
✅ **API endpoints** for interactive features
✅ **Responsive design** (mobile-friendly)
✅ **SEO optimized** (meta tags, schema markup, sitemaps)

---

## 🐛 Troubleshooting

**Build fails?**
```bash
# Check for TypeScript errors
npm run build

# Fix any errors shown
```

**Can't deploy to Railway?**
```bash
# Make sure you're logged in
railway whoami

# If not, login again
railway login
```

**Pages show "Not Found"?**
- Generate landing page content first: `npm run ai:landing`
- Or deploy without content (pages will work but show placeholder)

---

## 📚 Full Documentation

For detailed deployment guides, see:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for all platforms
- **[README.md](README.md)** - Project overview and features

---

## 🆘 Need Help?

- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Firebase docs: https://firebase.google.com/docs

---

## 🎉 Post-Deployment

After deploying:

1. **Test your site** - Click through all pages and features
2. **Set up custom domain** (optional)
3. **Submit sitemap** to Google Search Console
4. **Monitor analytics** and performance
5. **Celebrate!** 🎊
