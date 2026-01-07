import fs from 'fs';

const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

// Find duplicates by name (case-insensitive)
const nameMap = new Map();
platforms.forEach(p => {
  if (!p.name) {
    console.log(`⚠️  Found platform without name: ID=${p.id}`);
    return;
  }
  const nameLower = p.name.toLowerCase().trim();
  if (!nameMap.has(nameLower)) {
    nameMap.set(nameLower, []);
  }
  nameMap.get(nameLower).push(p);
});

// Show duplicates
console.log('=== DUPLICATE PLATFORMS ===\n');
let totalDuplicates = 0;
const duplicates = [];

nameMap.forEach((list, name) => {
  if (list.length > 1) {
    console.log(`${name} (${list.length} entries):`);
    list.forEach(p => {
      console.log(`  - ID: ${p.id} | Slug: ${p.slug || 'N/A'} | Category: ${p.category} | Featured: ${p.featured ? 'YES' : 'no'} | Rating: ${p.rating || 'N/A'}`);
    });
    console.log('');
    totalDuplicates += list.length - 1;
    duplicates.push({ name, entries: list });
  }
});

console.log(`Total duplicate entries: ${totalDuplicates}`);
console.log(`Total platforms: ${platforms.length}`);
console.log(`\nAfter deduplication: ${platforms.length - totalDuplicates} platforms`);

// Check for Claude specifically
console.log('\n=== CLAUDE SEARCH ===');
const claudeMatches = platforms.filter(p =>
  p.name && (p.name.toLowerCase().includes('claude') ||
  p.description?.toLowerCase().includes('claude'))
);
console.log(`Found ${claudeMatches.length} Claude-related platforms:`);
claudeMatches.forEach(p => {
  console.log(`  - ${p.name} (ID: ${p.id})`);
});

// Check for Gemini specifically
console.log('\n=== GEMINI SEARCH ===');
const geminiMatches = platforms.filter(p =>
  p.name && p.name.toLowerCase().includes('gemini')
);
console.log(`Found ${geminiMatches.length} Gemini-related platforms:`);
geminiMatches.forEach(p => {
  console.log(`  - ${p.name} (ID: ${p.id})`);
});
