# AI Platforms Directory - Project Structure

**Last Updated:** January 7, 2026
**Status:** ✅ Clean - No duplicate directories

---

## ⚠️ IMPORTANT: SINGLE SOURCE OF TRUTH

This project has **ONE** root directory. There is **NO** subdirectory structure.

**Correct Path (ROOT):**
```
c:\Users\geras\OneDrive\Desktop\AI PLATFORMS LIST 2025\
```

**Previously Deleted:**
- `ai-platforms-directory/` subdirectory was removed on 2026-01-07 (commit: 9a87571)
- This subdirectory was a duplicate and NOT deployed by Railway

---

## 🎯 Key File Locations

### Component Files (LIVE/DEPLOYED)
```
src/components/CategoryMegaMenu.tsx    ← Active component
src/components/CategoryMegaMenu.css    ← Active styles (EDIT THIS ONE)
src/pages/Home.tsx                     ← Uses CategoryMegaMenu
```

### Deployment Configuration
```
railway.json           ← Railway deployment config
package.json           ← Build scripts
server.js              ← Production server
vite.config.ts         ← Build configuration
```

### Data Files
```
platforms.json         ← Main platform database (3.5MB)
blog-posts/            ← Blog content
alternatives-content/  ← Alternatives pages
pillar-content/        ← SEO pillar content
```

---

## 🚀 Deployment Flow

**Platform:** Railway
**Build Command:** `npm install && npm run build`
**Start Command:** `node server.js`
**Auto-Deploy:** GitHub `master` branch → Railway

**Build Output:** `dist/` folder (generated during build, not committed)

---

## ✅ Recent Fixes Applied

### 1. CategoryMegaMenu Horizontal Scroll Fix
**Commit:** `e4669dd` (2026-01-07)
**File:** `src/components/CategoryMegaMenu.css`
**Changes:**
- Dropdown width: `width: calc(100vw - 80px)` with `max-width: 900px`
- Grid layout: Changed from 4 columns to `repeat(2, 1fr)`
- Centering: `left: 50%; transform: translateX(-50%)`
- Mobile responsive breakpoints optimized

### 2. Duplicate Directory Removal
**Commit:** `9a87571` (2026-01-07)
**Removed:** Entire `ai-platforms-directory/` subdirectory (3,560 files)
**Reason:** Was a duplicate not deployed by Railway - caused confusion

---

## 🔧 When Making Changes

### ✅ DO:
1. Edit files in the ROOT directory (`AI PLATFORMS LIST 2025/`)
2. Look for files directly under `src/components/`
3. Verify changes by checking `git status` shows files without subdirectory prefix
4. Test locally with `npm run dev`
5. Commit and push to `master` branch for auto-deployment

### ❌ DON'T:
1. Look for or create files in `ai-platforms-directory/` (doesn't exist anymore)
2. Edit files with paths like `ai-platforms-directory/src/...` (won't deploy)
3. Create duplicate component files

---

## 🧹 Verification Commands

**Check for duplicate directories:**
```bash
find . -type d -name "ai-platforms-directory"
# Should return: nothing (directory doesn't exist)
```

**Verify component location:**
```bash
ls -la src/components/CategoryMegaMenu.*
# Should show files directly under src/components/
```

**Check working tree is clean:**
```bash
git status
# Should show: "nothing to commit, working tree clean"
```

---

## 📊 Project Stats

- **Total Platforms:** 1,012+
- **Categories:** 25+
- **Blog Posts:** 100+
- **Repository Size:** ~721k deletions from cleanup
- **Main Branch:** `master`
- **Node Version:** Latest LTS
- **Framework:** React + TypeScript + Vite

---

## 🎨 Component Architecture

### CategoryMegaMenu Component
**Purpose:** Dropdown menu for browsing platform categories
**Files:**
- `CategoryMegaMenu.tsx` - React component logic
- `CategoryMegaMenu.css` - Styling (Neubrutalist design)

**Used In:**
- `src/pages/Home.tsx` (line 187)

**Props:**
- `categories: Category[]` - Array of categories to display
- `onCategorySelect?: (slug: string) => void` - Optional callback

---

## 🔍 Common Issues & Solutions

### Issue: "Changes not showing after deployment"
**Solution:**
- Verify you're editing files in ROOT, not in a subdirectory
- Check file path doesn't include `ai-platforms-directory/`
- Run `git log -1` to see your commit was in the correct file

### Issue: "Can't find component files"
**Solution:**
- Files are at `src/components/CategoryMegaMenu.*`
- NOT at `ai-platforms-directory/src/components/...`

### Issue: "Railway build failing"
**Solution:**
- Check `railway.json` build command
- Verify `package.json` scripts are correct
- Review Railway logs for specific error

---

## 📝 Quick Reference

**Local Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

**Git Workflow:**
```bash
git status           # Check what changed
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push             # Push to GitHub (triggers Railway deploy)
```

**Component Editing:**
```bash
# Edit the mega menu dropdown
code src/components/CategoryMegaMenu.css
code src/components/CategoryMegaMenu.tsx

# Edit the homepage
code src/pages/Home.tsx
```

---

## 📌 Key Takeaway

**There is only ONE project directory. Railway deploys from the ROOT.**

All files are in: `c:\Users\geras\OneDrive\Desktop\AI PLATFORMS LIST 2025\`

No confusion. No duplicates. Clean structure. 🎯
