# Dynamic OG Image Generator - Usage Guide

## Overview

Your site now has a **code-based dynamic OG image generator** instead of a static image file!

**Endpoint:** `https://aiplatformslist.com/og-image.png`

## Features

✅ **Generates images on-the-fly** (no Photoshop/Figma needed)
✅ **Customizable** via URL parameters
✅ **1200×630 pixels** (perfect for all social platforms)
✅ **24-hour cache** for performance
✅ **Professional design** with gradients and modern styling

---

## How It Works

The server generates PNG images using:
- **Satori** - Converts HTML/CSS to SVG
- **Sharp** - Converts SVG to PNG
- **Inter Font** - Professional typography

---

## Basic Usage

### Default Homepage Image

```tsx
<SocialMetaTags
  title="AI Platforms List"
  description="Discover 733+ AI Tools & Software"
  url="https://aiplatformslist.com"
  // Uses default: https://aiplatformslist.com/og-image.png
/>
```

**URL:** `https://aiplatformslist.com/og-image.png`

---

## Custom Dynamic Images

### Category Pages

```tsx
<SocialMetaTags
  title={`Best ${categoryName} AI Tools`}
  description={`Explore ${count} ${categoryName} platforms`}
  url={`https://aiplatformslist.com/category/${slug}`}
  image={`https://aiplatformslist.com/og-image.png?title=${encodeURIComponent(`Best ${categoryName} AI Tools`)}&subtitle=${encodeURIComponent(`Explore ${count} platforms`)}`}
/>
```

**Example:** `/og-image.png?title=Best%20Writing%20AI%20Tools&subtitle=Explore%2050+%20platforms`

---

### Platform Detail Pages

```tsx
const ogImage = `https://aiplatformslist.com/og-image.png?` +
  `title=${encodeURIComponent(platform.name)}` +
  `&subtitle=${encodeURIComponent(platform.description?.substring(0, 80) || '')}`;

<SocialMetaTags
  title={platform.name}
  description={platform.description}
  url={`https://aiplatformslist.com/platform/${platform.slug}`}
  image={ogImage}
/>
```

---

### Comparison Pages

```tsx
const comparisonImage = `https://aiplatformslist.com/og-image.png?` +
  `title=${encodeURIComponent(`${platform1} vs ${platform2}`)}` +
  `&subtitle=${encodeURIComponent('Complete Comparison Guide')}`;

<SocialMetaTags
  title={`${platform1} vs ${platform2}`}
  description="Side-by-side comparison..."
  url={`https://aiplatformslist.com/compare/${slug}`}
  image={comparisonImage}
/>
```

---

### Best-Of Pages

```tsx
const bestOfImage = `https://aiplatformslist.com/og-image.png?` +
  `title=${encodeURIComponent('Best AI Tools 2025')}` +
  `&subtitle=${encodeURIComponent('Expert-Curated Collection')}`;
```

---

## Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `title` | Main heading text (auto-sizes if long) | `AI Platforms List` |
| `subtitle` | Secondary text below title | `Discover 733+ AI Tools` |
| `type` | Page type (currently not used) | `home`, `category`, `platform` |

---

## Design Specifications

- **Size:** 1200×630 pixels (2:1 ratio)
- **Format:** PNG
- **Background:** Dark gradient (#0f0f23 → #1a1a2e)
- **Accent Color:** Purple gradient (#667eea → #764ba2)
- **Font:** Inter Bold (700 weight)
- **Caching:** 24 hours (CDN-friendly)

---

## Implementation Examples

### Option 1: Simple Static (Current)

Keep your current setup - works perfectly for homepage:

```tsx
// Uses default image at /og-image.png
<SocialMetaTags
  title="AI Platforms List"
  description="..."
  url="https://aiplatformslist.com"
/>
```

### Option 2: Create Helper Function (Recommended)

Create a helper to generate dynamic OG images:

```tsx
// src/utils/ogImage.ts
export function generateOgImageUrl(title: string, subtitle?: string): string {
  const baseUrl = 'https://aiplatformslist.com/og-image.png';

  if (!subtitle) {
    return baseUrl;
  }

  const params = new URLSearchParams({
    title: title,
    subtitle: subtitle
  });

  return `${baseUrl}?${params.toString()}`;
}

// Usage:
<SocialMetaTags
  title="Best AI Tools"
  description="..."
  url="https://aiplatformslist.com/best/ai-tools"
  image={generateOgImageUrl('Best AI Tools 2025', 'Expert-Curated Collection')}
/>
```

---

## Testing

### Test in Browser
Visit these URLs to see generated images:

1. **Default:** http://localhost:3001/og-image.png
2. **Custom:** http://localhost:3001/og-image.png?title=Test%20Title&subtitle=Test%20Subtitle

### Test Social Sharing
Use these tools to verify:

- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/
- **General:** https://www.opengraph.xyz/

---

## Customization

Want to change the design? Edit the `server.js` file around line 300:

```javascript
// server.js - Dynamic OG Image Generator

// Change colors:
background: 'linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%)'

// Change font size:
fontSize: '72px'  // Make text bigger/smaller

// Change layout:
alignItems: 'center'  // Center instead of left-align
```

---

## Benefits Over Static Images

✅ **No design work** - Update text instantly via URL
✅ **Consistent branding** - All images use same design
✅ **Dynamic content** - Shows current platform count
✅ **Easy A/B testing** - Test different titles without creating new images
✅ **Scalable** - Generate thousands of unique images automatically

---

## What's Included

1. ✅ Dynamic image generator route (`/og-image.png`)
2. ✅ Font loading (Inter Bold)
3. ✅ Caching headers (24-hour cache)
4. ✅ Error handling
5. ✅ Professional design template

---

## Next Steps (Optional)

Want to enhance further? Consider:

1. **Add logo** - Load your actual logo instead of emoji
2. **Multiple templates** - Different designs for different page types
3. **Add stats** - Show real-time platform count, ratings
4. **Backgrounds** - Add pattern overlays or images
5. **Color themes** - Different colors per category

---

## Need Help?

The code is in [server.js](server.js) starting at line 290.

**Documentation:**
- [Satori Docs](https://github.com/vercel/satori)
- [Sharp Docs](https://sharp.pixelplumbing.com/)
- [OG Image Best Practices](https://www.opengraph.xyz/blog/og-image-guide)
