# 🗺️ AI Platforms Directory - Complete Project Guide

**Your single source of truth for navigating this project.**

---

## 📁 Project Structure Overview

```
ai-platforms-directory/
├── 📊 DATA FILES (What you see on the website)
│   ├── platforms.json              # All 1103+ AI platforms (MAIN DATABASE)
│   ├── alternatives-content/       # "X vs Y" comparison pages
│   ├── bestof-content/             # "Best of Category" guide pages
│   ├── blog-posts/                 # Blog articles
│   ├── comparison-content/         # Tool comparison pages
│   └── pillar-content/             # Category guide pages
│
├── 🎨 FRONTEND (What users see)
│   └── src/
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Full page views
│       ├── styles/                 # CSS stylesheets
│       └── utils/                  # Helper functions
│
├── 🤖 AUTOMATION SCRIPTS (Auto-generate content)
│   └── scripts/
│       ├── continuous-discovery.mjs    # Find new AI tools daily
│       ├── blog-generator.mjs          # Generate blog posts
│       ├── generate-alternatives-pages.mjs
│       ├── generate-bestof-pages.mjs
│       └── ... (20+ automation scripts)
│
├── 📖 DOCUMENTATION (How-to guides)
│   ├── PROJECT_GUIDE.md            # ⭐ THIS FILE - Start here!
│   ├── DEPLOYMENT_GUIDE.md         # How to deploy
│   ├── AI-CHATBOT-SETUP.md         # Telegram bot setup
│   └── ... (25+ guide files)
│
└── ⚙️ CONFIG FILES (Don't touch unless you know what you're doing)
    ├── package.json                # Dependencies
    ├── vite.config.ts              # Build config
    ├── tsconfig.json               # TypeScript config
    └── server.js                   # Backend API server
```

---

## 🎯 Quick Reference: "I Want To..."

### 📝 Content & Data

| Task | File to Edit | Location |
|------|-------------|----------|
| **Add new AI platform** | `platforms.json` | Root directory |
| **Edit platform details** | `platforms.json` | Root directory |
| **Add blog post** | Create new `.json` file | `blog-posts/` |
| **Add comparison page** | Create new `.json` file | `comparison-content/` |
| **Add "Best of" guide** | Create new `.json` file | `bestof-content/` |

### 🎨 Design & Layout

| Task | File to Edit | Location |
|------|-------------|----------|
| **Edit navigation menu** | `Navigation.tsx` | `src/components/` |
| **Edit mega menu categories** | `category-organization.ts` | `src/utils/` |
| **Change homepage layout** | `Home.tsx` | `src/pages/` |
| **Edit footer** | `Footer.tsx` | `src/components/` |
| **Change global styles** | `index.css` | `src/` |
| **Mobile responsive fixes** | `guides-mobile.css`, `LegalPage.css` | `src/pages/` |

### 🔧 Functionality

| Task | File to Edit | Location |
|------|-------------|----------|
| **Add new page route** | `App.tsx` | `src/` |
| **Edit API endpoints** | `server.js` | Root directory |
| **Analytics tracking** | `analytics.ts` | `src/utils/` |
| **SEO metadata** | `SocialMetaTags.tsx` | `src/components/` |

---

## 📊 The Main Database: `platforms.json`

**Location:** Root directory
**What it contains:** Every AI platform on your website (1103+ platforms)

### Platform Entry Structure

```json
{
  "id": "unique-platform-id",
  "name": "Platform Name",
  "url": "https://platform-url.com",
  "description": "What it does",
  "categories": ["category-slug", "another-category"],
  "pricing": "Free/Paid/Freemium",
  "verified": true,
  "featured": false,
  "addedDate": "2025-01-06"
}
```

### How to Add a Platform

1. Open `platforms.json` in VS Code
2. Find the end of the array (look for `]`)
3. Add a comma after the last platform
4. Paste your new platform object
5. Save and commit

**Example:**
```json
{
  "id": "my-new-tool",
  "name": "My New AI Tool",
  "url": "https://mynewaitool.com",
  "description": "AI-powered productivity assistant",
  "categories": ["productivity", "ai-assistants"],
  "pricing": "Freemium",
  "verified": true,
  "featured": false,
  "addedDate": "2025-01-06"
}
```

---

## 🎨 Frontend Components Guide

### Key Component Files

#### 1. **Navigation Bar** (`src/components/Navigation.tsx`)
- Top black menu bar
- Search functionality
- Desktop & mobile menus
- **Recently updated:** Now uses organized mega menu

#### 2. **Mega Menu** (`src/components/MegaMenu.tsx`)
- Dropdown when clicking "CATEGORIES"
- Shows ALL categories organized into 14 sections
- Mobile accordion, desktop multi-column
- Includes search filter

#### 3. **Category Organization** (`src/utils/category-organization.ts`)
- Defines 14 category sections:
  - 🤖 AI Models & LLMs
  - 💻 Code & Development
  - 🎨 Creative & Design
  - ✍️ Content & Writing
  - 💼 Business & Productivity
  - 📊 Data & Analytics
  - 🗣️ Voice & Audio
  - 🎓 Research & Education
  - 🔨 No-Code & Low-Code
  - 🏢 Enterprise Solutions
  - 🏥 Industry-Specific
  - 👁️ Computer Vision
  - 📝 NLP & Text
  - 🧪 ML & Data Science

**To add a category to a section:**
```typescript
{
  id: 'code-dev',
  title: 'Code & Development',
  icon: '💻',
  categories: [
    'code-ai',
    'developer-tools',
    'your-new-category-slug'  // Add here
  ]
}
```

#### 4. **Homepage** (`src/pages/Home.tsx`)
- Hero section
- Featured categories
- Platform grid
- Search functionality

#### 5. **Footer** (`src/components/Footer.tsx`)
- Links to legal pages
- Social media
- Newsletter signup

---

## 📄 Page Files Guide

### Main Pages

| Page | File | What It Shows |
|------|------|---------------|
| **Homepage** | `src/pages/Home.tsx` | Hero, search, categories, platforms |
| **Category Page** | `src/pages/CategoryPage.tsx` | All platforms in a category |
| **Platform Detail** | `src/pages/PlatformDetail.tsx` | Single platform info |
| **Guides** | `src/pages/Guides.tsx` | All guides/resources |
| **Blog** | `src/pages/Blog.tsx` | Blog post list |
| **About** | `src/pages/About.tsx` | About the directory |
| **Submit Tool** | `src/pages/SubmitTool.tsx` | Form to submit new tools |

### Legal Pages (all in `src/pages/legal/`)

- `PrivacyPolicy.tsx`
- `TermsOfService.tsx`
- `CookiePolicy.tsx`
- `DMCA.tsx`
- `Disclaimer.tsx`

**Mobile responsive:** All legal pages use `LegalPage.css` for mobile-friendly layout

---

## 🤖 Automation Scripts

**Location:** `scripts/` directory

### Most Important Scripts

#### **Content Generation**
```bash
# Generate blog posts
node scripts/blog-generator.mjs

# Generate "Best of" category guides
node scripts/generate-bestof-pages.mjs

# Generate comparison pages
node scripts/generate-comparison-pages.mjs

# Generate alternatives pages
node scripts/generate-alternatives-pages.mjs
```

#### **Platform Discovery**
```bash
# Find new AI tools automatically
node scripts/continuous-discovery.mjs

# Validate platform URLs
node scripts/validate-urls.mjs
```

#### **Maintenance**
```bash
# Remove duplicate platforms
node scripts/deduplicate.mjs

# Find duplicate URLs
node scripts/find-url-duplicates.mjs

# Clean up featured flags
node scripts/cleanup-featured.mjs
```

---

## 🚀 Deployment

### Quick Deploy

```bash
# Build the project
npm run build

# Push to GitHub (auto-deploys to Railway)
git add .
git commit -m "Your message"
git push origin master
```

**Deploy location:** Railway auto-deploys from GitHub master branch
**Live URL:** https://aiplatformslist.com
**Deploy time:** 2-3 minutes after push

### What Gets Deployed

1. Build runs (`npm run build`)
2. Creates `dist/` folder with optimized files
3. `server.js` starts and serves:
   - Frontend from `dist/`
   - API endpoints (`/api/*`)
   - Static files from `public/`

---

## 📖 Documentation Files

### Essential Guides

| File | Purpose |
|------|---------|
| `PROJECT_GUIDE.md` | ⭐ **THIS FILE** - Complete project navigation |
| `DEPLOYMENT_GUIDE.md` | How to deploy to Railway/Vercel |
| `AI-CHATBOT-SETUP.md` | Telegram bot setup |
| `AUTOMATION_GUIDE.md` | How automation scripts work |
| `CONTENT_REVIEW_CHECKLIST.md` | Quality check before publishing |
| `SEO_PHASE4_PILLAR_CONTENT.md` | SEO content strategy |

### Reference Docs

- `EEAT_AUTHORITY_FRAMEWORK.md` - SEO authority building
- `MONETIZATION_GUIDE.md` - Revenue strategies
- `SECURITY_AUDIT.md` - Security best practices
- `PLATFORM_PAGES_GUIDE.md` - Individual platform pages

---

## 🎨 Styling System

### CSS File Organization

```
src/
├── index.css                    # Global styles (colors, fonts, base)
├── components/
│   ├── Navigation.css           # Top nav bar
│   ├── MegaMenu.css            # Category mega menu
│   ├── Footer.css              # Footer
│   └── ScrollButtons.css       # Scroll to top
├── pages/
│   ├── CategoryPage.css        # Category pages
│   ├── guides-mobile.css       # Guides page mobile
│   └── legal/LegalPage.css     # Legal pages mobile
└── styles/
    ├── InteractiveComponents.css  # Widgets
    ├── ChatWidget.css             # Telegram widget
    └── LandingPage.css            # Landing pages
```

### Design System

**Colors:**
- Primary: `#000000` (Black)
- Background: `#ffffff` (White)
- Accent: `#ffff00` (Yellow)
- Gray: `#f5f5f5`

**Typography:**
- Main font: `'Courier New', monospace`
- Headings: Bold, uppercase, 900 weight
- Body: 600-700 weight

**Brutalist Aesthetic:**
- Thick borders (3-6px)
- High contrast
- No gradients
- Sharp edges (no border-radius)

---

## ⚙️ Configuration Files

**Don't edit these unless you know what you're doing:**

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, metadata |
| `vite.config.ts` | Build configuration |
| `tsconfig.json` | TypeScript settings |
| `server.js` | Backend API server |
| `.env` | Environment variables (API keys - **NEVER COMMIT**) |
| `.env.example` | Example env vars (safe to commit) |

---

## 🔍 Common Tasks - Step by Step

### Task 1: Add a New AI Platform

1. Open `platforms.json` in the **root directory**
2. Scroll to the bottom
3. Before the closing `]`, add:
```json
,
{
  "id": "unique-slug",
  "name": "Tool Name",
  "url": "https://tool.com",
  "description": "What it does",
  "categories": ["category-slug"],
  "pricing": "Free",
  "verified": true,
  "addedDate": "2025-01-06"
}
```
4. Save
5. Commit: `git add platforms.json && git commit -m "Add [Tool Name]" && git push`

### Task 2: Change Mega Menu Organization

1. Open `src/utils/category-organization.ts`
2. Find the section you want to edit (search for section `id`)
3. Add/remove category slugs from the `categories` array
4. Save and deploy

### Task 3: Fix Mobile Layout Issue

1. Identify the page with the issue
2. Find its CSS file:
   - Guides page → `src/pages/guides-mobile.css`
   - Legal pages → `src/pages/legal/LegalPage.css`
   - Homepage → `src/pages/Home.tsx` (inline styles) or `src/index.css`
3. Add mobile-specific styles:
```css
@media (max-width: 768px) {
  .your-class {
    /* Mobile styles here */
  }
}
```

### Task 4: Add a New Blog Post

1. Create `blog-posts/my-new-post.json`
2. Use this template:
```json
{
  "title": "Post Title",
  "slug": "post-slug",
  "metaDescription": "SEO description",
  "publishedDate": "2025-01-06",
  "author": "Your Name",
  "sections": [
    {
      "heading": "Introduction",
      "content": "Post content here..."
    }
  ]
}
```
3. The blog page will auto-detect it

### Task 5: Update Navigation Links

1. Open `src/components/Navigation.tsx`
2. Find the menu section (desktop or mobile)
3. Add your link:
```tsx
<li>
  <Link to="/your-page" onClick={closeMenu}>
    Your Link
  </Link>
</li>
```
4. Make sure the route exists in `src/App.tsx`

---

## 🆘 Troubleshooting

### "My changes aren't showing on the website"

**Check:**
1. Did you push to GitHub? (`git push origin master`)
2. Wait 2-3 minutes for Railway deployment
3. Hard refresh browser (Ctrl+Shift+R)
4. Check Railway logs for build errors

### "Build failing with TypeScript errors"

**Fix:**
1. Read the error message - it tells you the file and line
2. Common fixes:
   - Remove unused imports
   - Add missing type definitions
   - Remove unused variables

### "Categories not showing in mega menu"

**Fix:**
1. Check `src/utils/category-organization.ts`
2. Make sure your category slug is in one of the sections
3. Categories not in any section go to "Other"

### "Platform not appearing on website"

**Check:**
1. Is it in `platforms.json` in the **root directory**?
2. Is the JSON valid? (no trailing commas, proper quotes)
3. Does the category exist?
4. Did you deploy the changes?

---

## 📞 Quick Command Reference

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production

# Git
git status          # Check what changed
git add .           # Stage all changes
git commit -m "msg" # Commit changes
git push            # Deploy to production
git log --oneline   # See recent commits

# Scripts
node scripts/[script-name].mjs    # Run automation script
```

---

## 🗂️ File Count Summary

- **Total platforms:** 1103+ in `platforms.json`
- **React components:** 25+ in `src/components/`
- **Pages:** 20+ in `src/pages/`
- **Automation scripts:** 30+ in `scripts/`
- **Documentation files:** 25+ markdown guides
- **Content files:** 100+ in various directories

---

## 🎯 Pro Tips

1. **Always work in `ai-platforms-directory/` subdirectory**, not the parent folder
2. **The mega menu is in the navigation bar**, not the homepage categories
3. **Mobile styles use `clamp()`** for fluid typography
4. **All legal pages share** `LegalPage.css` for consistency
5. **Category slugs are lowercase-with-dashes** (e.g., `code-ai`, not `Code AI`)
6. **Search the project** with `Ctrl+Shift+F` in VS Code
7. **Use Git Desktop** if command line is confusing

---

## 📚 Next Steps

**New to the project?**
1. Read this guide (you're doing it!)
2. Open `platforms.json` to see the data structure
3. Run `npm run dev` to see the site locally
4. Make a small change and deploy it

**Need to make changes?**
1. Find your task in "Quick Reference: I Want To..."
2. Follow the step-by-step guide
3. Test locally with `npm run dev`
4. Deploy with `git push`

**Want to understand the code?**
1. Start with `src/App.tsx` - this defines all routes
2. Read `src/pages/Home.tsx` - this is the homepage
3. Check `src/components/Navigation.tsx` - this is the nav bar

---

**Still confused? Search this file for keywords using Ctrl+F**

**Questions? Check the other `.md` files in the root directory.**

**Last Updated:** 2025-01-06
