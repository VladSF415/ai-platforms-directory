import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the blog post
const blogPath = path.join(__dirname, '..', 'blog-posts', 'top-20-seo-tools-2026.json');
const blog = JSON.parse(fs.readFileSync(blogPath, 'utf8'));

// Platform mappings - platform name to slug
const platformLinks = {
  'RoastWeb': '/platform/roastweb',
  'Semrush': '/platform/semrush',
  'Ahrefs': '/platform/ahrefs',
  'SE Ranking': '/platform/se-ranking',
  'Screaming Frog': '/platform/screaming-frog',
  'GTmetrix': '/platform/gtmetrix',
  'Moz Pro': '/platform/moz',
  'Sitebulb': '/platform/sitebulb',
  'Surfer SEO': '/platform/surfer-seo',
  'Lumar': '/platform/lumar',
  'Ryte': '/platform/ryte',
  'Woorank': '/platform/woorank',
  'WebCEO': '/platform/webceo',
  'DemandJump': '/platform/demandjump',
  'Yoast SEO': '/platform/yoast',
  'MonitorRank': '/platform/monitorrank',
  'ContentStudio': '/platform/contentstudio',
  'AccuRanker': '/platform/accuranker',
  'Google Search Console': '/platform/google-search-console',
  'Bing Webmaster Tools': '/platform/bing-webmaster-tools'
};

let content = blog.content;

// Add links to platform names
// We'll do this carefully to avoid double-linking or breaking existing formatting
Object.entries(platformLinks).forEach(([platformName, platformSlug]) => {
  // Only link if not already linked
  // Pattern: Match platform name that's NOT already in a markdown link
  // Negative lookbehind: not preceded by [
  // Negative lookahead: not followed by ]( or ](/

  const pattern = new RegExp(
    `(?<!\\[)\\b(${platformName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?!\\]\\(|\\]\\s*\\()`,
    'g'
  );

  // Replace with markdown link
  content = content.replace(pattern, `[$1](${platformSlug})`);
});

// Update the blog post
blog.content = content;

// Write back
fs.writeFileSync(blogPath, JSON.stringify(blog, null, 2), 'utf8');

console.log('✅ Added platform links to blog post');
console.log(`📊 Linked platforms: ${Object.keys(platformLinks).length}`);
