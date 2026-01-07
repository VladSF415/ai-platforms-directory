# ⚡ Quick Start Guide

**Get productive in 5 minutes.**

---

## 🎯 Most Common Tasks

### 1️⃣ Add a New AI Platform

**File:** `platforms.json` (root directory)

```bash
# 1. Open the file
code platforms.json

# 2. Add your platform at the end (before the ])
{
  "id": "my-tool",
  "name": "My AI Tool",
  "url": "https://mytool.com",
  "description": "What it does",
  "categories": ["category-slug"],
  "pricing": "Free",
  "verified": true,
  "addedDate": "2025-01-06"
}

# 3. Save and deploy
git add platforms.json
git commit -m "Add My AI Tool"
git push origin master
```

**Wait 2-3 minutes → Check https://aiplatformslist.com**

---

### 2️⃣ Edit Navigation Menu

**File:** `src/components/Navigation.tsx`

**Desktop menu:** Lines 143-452
**Mobile menu:** Lines 485-568

Add a link:
```tsx
<li>
  <Link to="/your-page" onClick={closeMenu}>
    Your Link Text
  </Link>
</li>
```

---

### 3️⃣ Change Mega Menu Categories

**File:** `src/utils/category-organization.ts`

Add a category to a section:
```typescript
{
  id: 'code-dev',
  title: 'Code & Development',
  categories: [
    'code-ai',
    'your-new-category'  // Add here
  ]
}
```

---

### 4️⃣ Fix Mobile Layout

**Guides page:** `src/pages/guides-mobile.css`
**Legal pages:** `src/pages/legal/LegalPage.css`
**Homepage:** `src/index.css`

Add responsive styles:
```css
@media (max-width: 768px) {
  .your-element {
    padding: 16px;
    font-size: 14px;
  }
}
```

---

### 5️⃣ Add a Blog Post

**Location:** `blog-posts/`

Create `blog-posts/my-post.json`:
```json
{
  "title": "My Blog Post",
  "slug": "my-post",
  "metaDescription": "Description for SEO",
  "publishedDate": "2025-01-06",
  "category": "AI News",
  "sections": [
    {
      "heading": "Introduction",
      "content": "Your content here..."
    }
  ]
}
```

Auto-appears at `/blog`

---

## 📂 File Locations Cheat Sheet

```
WHERE IS...?

✅ Platform data
   → platforms.json (root)

✅ Navigation menu
   → src/components/Navigation.tsx

✅ Mega menu organization
   → src/utils/category-organization.ts

✅ Homepage
   → src/pages/Home.tsx

✅ Footer
   → src/components/Footer.tsx

✅ Mobile CSS
   → src/pages/guides-mobile.css
   → src/pages/legal/LegalPage.css

✅ Blog posts
   → blog-posts/*.json

✅ Automation scripts
   → scripts/*.mjs

✅ API server
   → server.js (root)
```

---

## 🚀 Deploy Changes

```bash
# Every time you make changes:
git add .
git commit -m "What you changed"
git push origin master

# Wait 2-3 minutes
# Hard refresh: Ctrl+Shift+R
```

---

## 🔧 Development Commands

```bash
# Start local server
npm run dev
# → Open http://localhost:5173

# Build for production
npm run build

# Test build locally
npm run preview
```

---

## 🆘 Common Issues

### ❌ "Changes not showing"
- ✅ Did you push? (`git push`)
- ✅ Wait 2-3 minutes
- ✅ Hard refresh (Ctrl+Shift+R)

### ❌ "Build error"
- ✅ Check TypeScript errors
- ✅ Remove unused imports
- ✅ Run `npm run build` locally

### ❌ "Mega menu not working"
- ✅ Click "CATEGORIES" in top nav
- ✅ Check `src/utils/category-organization.ts`
- ✅ Verify categories array

---

## 📖 Need More Help?

**Read:** `PROJECT_GUIDE.md` - Complete documentation
**Search:** Use Ctrl+F in PROJECT_GUIDE.md
**Check:** Other `.md` files in root directory

---

**Last Updated:** 2025-01-06
