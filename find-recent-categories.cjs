const platforms = require('./platforms.json');

// Find platforms added in December 2026 or recently
const recentPlatforms = platforms.filter(p => {
  const addedDate = p.added_date || p.createdAt;
  if (!addedDate) return false;

  let date;
  if (typeof addedDate === 'string') {
    date = new Date(addedDate);
  } else if (addedDate._seconds) {
    date = new Date(addedDate._seconds * 1000);
  } else {
    return false;
  }

  // December 2026 or later
  return date >= new Date('2026-12-01');
});

console.log(`Total platforms: ${platforms.length}`);
console.log(`Recent platforms (Dec 2026+): ${recentPlatforms.length}\n`);

// Group by category
const categoryCounts = {};
recentPlatforms.forEach(p => {
  const cat = p.category || 'uncategorized';
  if (!categoryCounts[cat]) {
    categoryCounts[cat] = {
      count: 0,
      platforms: [],
      avgRating: 0,
      totalRating: 0
    };
  }
  categoryCounts[cat].count++;
  categoryCounts[cat].platforms.push({
    name: p.name,
    rating: p.rating || 0,
    added: p.added_date || 'unknown'
  });
  categoryCounts[cat].totalRating += (p.rating || 0);
});

// Calculate averages
Object.keys(categoryCounts).forEach(cat => {
  categoryCounts[cat].avgRating = (categoryCounts[cat].totalRating / categoryCounts[cat].count).toFixed(2);
});

// Sort by count
const sorted = Object.entries(categoryCounts).sort((a, b) => b[1].count - a[1].count);

console.log('=== CATEGORIES WITH RECENT ADDITIONS (Dec 2026+) ===\n');
sorted.forEach(([cat, data]) => {
  console.log(`${cat} (${data.count} recent platforms, avg rating: ${data.avgRating})`);
  data.platforms.forEach(p => {
    console.log(`  - ${p.name} (${p.rating}/5)`);
  });
  console.log('');
});

// Check which of these don't have pillar content
const fs = require('fs');
const pillarFiles = fs.readdirSync('./pillar-content');
const existingCategories = pillarFiles.map(f => {
  const match = f.match(/ultimate-guide-(.*)-ai-tools-2026\.json/);
  return match ? match[1] : null;
}).filter(Boolean);

console.log('\n=== RECENT CATEGORIES WITHOUT PILLAR CONTENT ===\n');
sorted.forEach(([cat, data]) => {
  const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hasContent = existingCategories.some(existing =>
    existing === slug ||
    existing.includes(slug) ||
    slug.includes(existing)
  );

  if (!hasContent) {
    console.log(`✗ ${cat} (${data.count} recent, ${data.avgRating} avg rating)`);
    console.log(`  Platforms: ${data.platforms.map(p => p.name).join(', ')}`);
    console.log('');
  }
});
