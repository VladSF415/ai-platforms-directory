#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://aiplatformslist.com';

function escapeXml(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap() {
  const urls = [];
  const now = new Date().toISOString().split('T')[0];

  // Homepage
  urls.push({
    loc: BASE_URL,
    lastmod: now,
    changefreq: 'daily',
    priority: '1.0'
  });

  // Static pages
  const staticPages = [
    '/about',
    '/submit',
    '/blog',
    '/guides',
    '/resources',
    '/how-to-choose-ai-platforms'
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: BASE_URL + page,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  // Load platforms
  const platforms = JSON.parse(readFileSync('./platforms.json', 'utf-8'));

  platforms.forEach(platform => {
    const slug = platform.slug || platform.id;
    urls.push({
      loc: `${BASE_URL}/platform/${escapeXml(slug)}`,
      lastmod: platform.last_updated?._seconds
        ? new Date(platform.last_updated._seconds * 1000).toISOString().split('T')[0]
        : now,
      changefreq: 'weekly',
      priority: platform.featured ? '0.9' : '0.7'
    });
  });

  // Load categories
  const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];

  categories.forEach(category => {
    urls.push({
      loc: `${BASE_URL}/category/${escapeXml(category)}`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.8'
    });
  });

  // Load blog posts
  try {
    const blogFiles = readdirSync('./blog-posts').filter(f => f.endsWith('.json'));
    blogFiles.forEach(file => {
      const post = JSON.parse(readFileSync(join('./blog-posts', file), 'utf-8'));
      if (post.slug) {
        urls.push({
          loc: `${BASE_URL}/blog/${escapeXml(post.slug)}`,
          lastmod: post.lastUpdated || now,
          changefreq: 'monthly',
          priority: '0.6'
        });
      }
    });
  } catch (e) {
    console.warn('Could not load blog posts:', e.message);
  }

  // Load alternatives pages
  try {
    const altFiles = readdirSync('./alternatives-content').filter(f => f.endsWith('.json'));
    altFiles.forEach(file => {
      const alt = JSON.parse(readFileSync(join('./alternatives-content', file), 'utf-8'));
      if (alt.slug) {
        urls.push({
          loc: `${BASE_URL}/alternatives/${escapeXml(alt.slug)}`,
          lastmod: alt.lastUpdated || now,
          changefreq: 'monthly',
          priority: '0.6'
        });
      }
    });
  } catch (e) {
    console.warn('Could not load alternatives:', e.message);
  }

  // Load comparison pages
  try {
    const compFiles = readdirSync('./comparison-content').filter(f => f.endsWith('.json'));
    compFiles.forEach(file => {
      const comp = JSON.parse(readFileSync(join('./comparison-content', file), 'utf-8'));
      if (comp.slug) {
        urls.push({
          loc: `${BASE_URL}/compare/${escapeXml(comp.slug)}`,
          lastmod: comp.lastUpdated || now,
          changefreq: 'monthly',
          priority: '0.6'
        });
      }
    });
  } catch (e) {
    console.warn('Could not load comparisons:', e.message);
  }

  // Load best-of pages
  try {
    const bestofFiles = readdirSync('./bestof-content').filter(f => f.endsWith('.json'));
    bestofFiles.forEach(file => {
      const bestof = JSON.parse(readFileSync(join('./bestof-content', file), 'utf-8'));
      if (bestof.slug) {
        urls.push({
          loc: `${BASE_URL}/best-of/${escapeXml(bestof.slug)}`,
          lastmod: bestof.lastUpdated || now,
          changefreq: 'weekly',
          priority: '0.7'
        });
      }
    });
  } catch (e) {
    console.warn('Could not load best-of pages:', e.message);
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  // Write sitemap
  writeFileSync('./public/sitemap.xml', xml);
  console.log(`✅ Generated sitemap with ${urls.length} URLs`);
  console.log(`📍 Saved to public/sitemap.xml`);
}

generateSitemap();
