# Dynamic OG Images - Implementation Examples

## Quick Start

Import the helper utilities:

```typescript
import { getCategoryOgImage, getPlatformOgImage, getComparisonOgImage } from '@/utils/ogImage';
import { SocialMetaTags } from '@/components/SocialMetaTags';
```

---

## Example 1: Category Page

**Before (static image):**
```tsx
<SocialMetaTags
  title="Writing AI Tools"
  description="Best AI writing tools..."
  url="https://aiplatformslist.com/category/writing"
  // Uses default static image
/>
```

**After (dynamic image):**
```tsx
import { getCategoryOgImage } from '@/utils/ogImage';

// In your component:
const categoryName = 'Writing';
const platformCount = filteredPlatforms.length;

<SocialMetaTags
  title={`${categoryName} AI Tools`}
  description={`Best AI ${categoryName.toLowerCase()} tools...`}
  url={`https://aiplatformslist.com/category/${categorySlug}`}
  image={getCategoryOgImage(categoryName, platformCount)}
/>
```

**Generated URL:**
```
https://aiplatformslist.com/og-image.png?title=Best%20Writing%20AI%20Tools&subtitle=Explore%2050%2B%20platforms%20in%20this%20category
```

---

## Example 2: Platform Detail Page

**Before:**
```tsx
<SocialMetaTags
  title={platform.name}
  description={platform.description}
  url={`https://aiplatformslist.com/platform/${platform.slug}`}
/>
```

**After:**
```tsx
import { getPlatformOgImage } from '@/utils/ogImage';

<SocialMetaTags
  title={platform.name}
  description={platform.description}
  url={`https://aiplatformslist.com/platform/${platform.slug}`}
  image={getPlatformOgImage(platform.name, platform.description)}
/>
```

**Example for "ChatGPT":**
```
/og-image.png?title=ChatGPT&subtitle=Conversational%20AI%20assistant%20powered%20by%20OpenAI%20for%20natural%20language...
```

---

## Example 3: Comparison Page

```tsx
import { getComparisonOgImage } from '@/utils/ogImage';

// In ComparisonPage.tsx:
const platform1Name = 'ChatGPT';
const platform2Name = 'Claude';

<SocialMetaTags
  title={`${platform1Name} vs ${platform2Name}`}
  description="Comprehensive comparison..."
  url={`https://aiplatformslist.com/compare/${slug}`}
  image={getComparisonOgImage(platform1Name, platform2Name)}
/>
```

---

## Example 4: Best-Of Page

```tsx
import { getBestOfOgImage } from '@/utils/ogImage';

<SocialMetaTags
  title="Best AI Tools 2025"
  description="Top AI platforms curated by experts"
  url="https://aiplatformslist.com/best/ai-tools-2025"
  image={getBestOfOgImage('Best AI Tools 2025', 'General')}
/>
```

---

## Example 5: Homepage with Stats

```tsx
import { getHomeOgImage } from '@/utils/ogImage';
import { useEffect, useState } from 'react';

function HomePage() {
  const [platformCount, setPlatformCount] = useState(733);

  useEffect(() => {
    // Fetch actual count from API
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setPlatformCount(data.total));
  }, []);

  return (
    <>
      <SocialMetaTags
        title="AI Platforms List"
        description="The most comprehensive directory of AI tools"
        url="https://aiplatformslist.com"
        image={getHomeOgImage(platformCount)}
      />
      {/* Rest of your page */}
    </>
  );
}
```

---

## Example 6: Alternative Pages

```tsx
import { getAlternativesOgImage } from '@/utils/ogImage';

<SocialMetaTags
  title={`${platformName} Alternatives`}
  description={`Discover the best alternatives to ${platformName}`}
  url={`https://aiplatformslist.com/alternatives/${slug}`}
  image={getAlternativesOgImage(platformName, alternativesCount)}
/>
```

---

## Example 7: Pillar/Guide Pages

```tsx
import { getGuideOgImage } from '@/utils/ogImage';

<SocialMetaTags
  title="Complete Guide to AI Writing Tools"
  description="Everything you need to know about AI writing assistants"
  url="https://aiplatformslist.com/guide/ai-writing-tools"
  image={getGuideOgImage('Complete Guide to AI Writing Tools')}
  type="article"
/>
```

---

## Testing Your Changes

### 1. Local Testing
Start your server and visit:
```
http://localhost:3001/og-image.png?title=Test&subtitle=Testing
```

### 2. Social Media Preview Testing

**Facebook Debugger:**
```
https://developers.facebook.com/tools/debug/?q=https://aiplatformslist.com/category/writing
```

**Twitter Card Validator:**
```
https://cards-dev.twitter.com/validator
```

**LinkedIn Inspector:**
```
https://www.linkedin.com/post-inspector/
```

### 3. Open Graph Checker
```
https://www.opengraph.xyz/url/https://aiplatformslist.com/category/writing
```

---

## Migration Checklist

- [ ] Update [CategoryPage.tsx](src/pages/CategoryPage.tsx) with `getCategoryOgImage()`
- [ ] Update [PlatformDetail.tsx](src/pages/PlatformDetail.tsx) with `getPlatformOgImage()`
- [ ] Update [ComparisonPage.tsx](src/pages/ComparisonPage.tsx) with `getComparisonOgImage()`
- [ ] Update [AlternativesPage.tsx](src/pages/AlternativesPage.tsx) with `getAlternativesOgImage()`
- [ ] Update [BestOfPage.tsx](src/pages/BestOfPage.tsx) with `getBestOfOgImage()`
- [ ] Update [PillarPage.tsx](src/pages/PillarPage.tsx) with `getGuideOgImage()`
- [ ] Update [Home.tsx](src/pages/Home.tsx) with `getHomeOgImage()`
- [ ] Test all pages in social media debuggers
- [ ] Clear social media cache for existing URLs

---

## Advanced: Custom Parameters

If you need even more control, use the base function:

```tsx
import { generateOgImageUrl } from '@/utils/ogImage';

const customImage = generateOgImageUrl(
  'Your Custom Title Here',
  'Your custom subtitle with any text you want'
);

<SocialMetaTags
  title="..."
  description="..."
  url="..."
  image={customImage}
/>
```

---

## Pro Tips

1. **Keep titles concise** - Long titles auto-size down but may become hard to read
2. **Subtitles should be descriptive** - This is what grabs attention
3. **Test on mobile** - Many shares happen on mobile devices
4. **Clear cache** - Social platforms cache OG images for 24-48 hours
5. **Use URL encoding** - The helper functions handle this automatically

---

## Common Issues

### Image not updating on social media?
Social platforms cache OG images. Clear the cache:
- Facebook: Use [Sharing Debugger](https://developers.facebook.com/tools/debug/) and click "Scrape Again"
- Twitter: Images cache for ~7 days
- LinkedIn: Use [Post Inspector](https://www.linkedin.com/post-inspector/)

### Getting 500 error?
Check server logs. Common issues:
- Font file not loaded
- Invalid characters in title/subtitle
- Server not running

### Text getting cut off?
- Titles over 60 characters auto-size smaller
- Subtitles have a max-width of 800px
- You can adjust font sizes in [server.js](server.js)

---

## Next Steps

1. Start with homepage and category pages
2. Roll out to platform detail pages
3. Add to comparison and alternatives pages
4. Customize design in server.js if needed
5. Monitor social media performance

Happy coding! 🚀
