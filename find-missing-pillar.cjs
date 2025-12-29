const platforms = require('./platforms.json');
const fs = require('fs');

// Get all unique categories from platforms
const categories = {};
platforms.forEach(p => {
  const cat = p.category;
  if (cat) {
    if (!categories[cat]) {
      categories[cat] = {
        count: 0,
        platforms: [],
        avgRating: 0,
        totalRating: 0
      };
    }
    categories[cat].count++;
    categories[cat].platforms.push(p.name);
    categories[cat].totalRating += (p.rating || 0);
  }
});

// Calculate average ratings
Object.keys(categories).forEach(cat => {
  categories[cat].avgRating = (categories[cat].totalRating / categories[cat].count).toFixed(2);
});

// Get existing pillar content
const pillarFiles = fs.readdirSync('./pillar-content');
const existingCategories = pillarFiles.map(f => {
  const match = f.match(/ultimate-guide-(.*)-ai-tools-2025\.json/);
  return match ? match[1] : null;
}).filter(Boolean);

console.log('=== CATEGORIES WITH PILLAR CONTENT ===\n');
existingCategories.forEach(cat => {
  console.log(`✓ ${cat}`);
});

console.log('\n\n=== CATEGORIES WITHOUT PILLAR CONTENT ===\n');

const categoriesWithoutPillar = [];

Object.keys(categories).sort((a, b) => categories[b].count - categories[a].count).forEach(cat => {
  const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hasContent = existingCategories.some(existing =>
    existing === slug ||
    existing.includes(slug) ||
    slug.includes(existing)
  );

  if (!hasContent) {
    categoriesWithoutPillar.push({
      category: cat,
      slug: slug,
      count: categories[cat].count,
      avgRating: categories[cat].avgRating,
      topPlatforms: categories[cat].platforms.slice(0, 5)
    });
    console.log(`✗ ${cat} (${categories[cat].count} platforms, avg rating: ${categories[cat].avgRating})`);
  }
});

console.log(`\n\nTotal categories: ${Object.keys(categories).length}`);
console.log(`With pillar content: ${existingCategories.length}`);
console.log(`Without pillar content: ${categoriesWithoutPillar.length}`);

console.log('\n\n=== TOP 10 CATEGORIES NEEDING PILLAR CONTENT (by platform count) ===\n');
categoriesWithoutPillar.slice(0, 10).forEach((cat, i) => {
  console.log(`${i + 1}. ${cat.category}`);
  console.log(`   Platforms: ${cat.count} | Avg Rating: ${cat.avgRating}`);
  console.log(`   Top 5: ${cat.topPlatforms.join(', ')}`);
  console.log('');
});
