# FOR FUTURE CLAUDE SESSIONS

**Read this first to get up to speed in 30 seconds.**

---

## What is this project?

AI Platforms Directory - a monetized directory of 693 AI tools with affiliate links, paid submissions, and featured listings.

- **Live:** https://ai-platforms-directory-production.up.railway.app
- **GitHub:** https://github.com/VladSF415/ai-platforms-directory
- **Status:** Fully functional, all features working
- **Analytics:** G-87QJXFEQQD (Google Analytics tracking live)

---

## Your role

**You handle all deployments.** Don't ask the user to deploy.

**Standard workflow:**
1. Make changes to code
2. `git add .`
3. `git commit -m "Description"`
4. `git push origin master`
5. Railway auto-deploys (wait 1-2 minutes)

---

## Project context

### Separate from MegaBot
- This is `/home/geras/ai-platforms-directory` (React app)
- MegaBot is `/home/geras/MEGABOT` (Telegram bot)
- Completely separate projects, don't mix them

### How it was built
- Built from scratch in previous sessions
- Migrated 693 platforms from Firebase to `platforms.json`
- Added monetization features (affiliates, submissions, featured listings)
- Recently added: Platform detail pages, Google Analytics, categorization fixes

### Key features
- ✅ 693 platforms in directory
- ✅ Individual detail pages for each platform (`/platform/:slug`)
- ✅ Google Analytics tracking (G-87QJXFEQQD)
- ✅ Affiliate click tracking
- ✅ Tool submission form ($49)
- ✅ Featured listing upgrades ($99-299)
- ✅ Search and category filtering
- ⏳ Domain pending (user needs to update DNS)

---

## Important recent changes

### Platform Detail Pages (Critical UX Change)
**User feedback:** "isn't it better to have each card to have full descripption of each platform, and from there user can click on Visit button to go to their website?"

**What changed:**
- Created `PlatformDetail.tsx` component
- Added route `/platform/:slug`
- Platform cards now navigate to detail pages (NOT direct external links)
- Detail pages show full info, then "Visit Website" button

**Impact:** Better UX, SEO, and conversion rates

### Categorization Fixes
- Fixed 54 miscategorized platforms
- LLMs category: 2 → 52 platforms
- Used `scripts/fix-categorization.cjs`

### Google Analytics Restored
- User had analytics before rebuild, stopped working
- Added GA4 scripts to `index.html`
- Created `src/utils/analytics.ts`
- Tracking: views, clicks, searches, filters, submissions

---

## Read these for details

1. **[PROJECT_HISTORY.md](PROJECT_HISTORY.md)** ← Start here for complete context
2. **[DEPLOYMENT_WORKFLOW.md](DEPLOYMENT_WORKFLOW.md)** ← How to deploy (you do it)
3. **[ANALYTICS_GUIDE.md](ANALYTICS_GUIDE.md)** ← Google Analytics setup
4. **[PLATFORM_PAGES_GUIDE.md](PLATFORM_PAGES_GUIDE.md)** ← Detail pages architecture

---

## Common tasks

### Add new platforms
Edit `platforms.json`, commit, push. Railway auto-deploys.

### Update categorization
Edit `platforms.json` or use `scripts/fix-categorization.cjs`, commit, push.

### Add analytics events
Edit `src/utils/analytics.ts`, import in component, commit, push.

### Change styling
Edit component .tsx files (inline styles), commit, push.

---

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Fastify serving platforms.json
- **Analytics:** Google Analytics 4 (G-87QJXFEQQD)
- **Payments:** Stripe (keys in environment)
- **Deploy:** Railway auto-deploys from GitHub
- **Data:** platforms.json (693 platforms)

---

## Key files

- `src/pages/Home.tsx` - Main directory page
- `src/pages/PlatformDetail.tsx` - Individual platform pages (NEW!)
- `src/pages/SubmitTool.tsx` - Submission form
- `src/utils/analytics.ts` - Analytics tracking (NEW!)
- `platforms.json` - 693 platforms database
- `server/index.ts` - Fastify backend
- `index.html` - GA4 scripts

---

## Pending tasks

Only one thing pending from previous sessions:

⏳ **Point aiplatformslist.com to Railway**
- User needs to update DNS in Namecheap
- Remove old Firebase A record
- Keep Railway CNAMEs
- User action required, not yours

---

## Quick reference

**Location:** `/home/geras/ai-platforms-directory`
**Branch:** `master`
**Deploy:** Push to GitHub → Railway auto-deploys
**Test locally:** `npm run dev`
**Verify deployed:** `curl -s https://ai-platforms-directory-production.up.railway.app | head -20`

---

## User priorities

Based on conversation history:

1. **UX matters** - User wanted detail pages instead of direct links
2. **Analytics are critical** - Track everything for monetization
3. **Data quality** - Fixed 54 miscategorized platforms
4. **You deploy** - Don't ask user to push/deploy manually
5. **Keep separate from MegaBot** - Independent projects

---

## What not to do

❌ Don't mix with MegaBot project
❌ Don't ask user to deploy
❌ Don't change Google Analytics ID (G-87QJXFEQQD)
❌ Don't undo categorization fixes
❌ Don't remove platform detail pages
❌ Don't suggest time estimates for tasks

---

## Summary

This is a complete, working AI platforms directory with 693 platforms, detail pages, analytics, and monetization features. All code is deployed and live. You handle all deployments by pushing to GitHub (Railway auto-deploys). Read PROJECT_HISTORY.md for complete context.

**Last updated:** 2025-12-05
**Status:** Production-ready, all features working
