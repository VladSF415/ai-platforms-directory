import fs from 'fs';

const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

console.log(`Starting with ${platforms.length} platforms...\n`);

// Track seen IDs and keep the best version of each
const idMap = new Map();

platforms.forEach(p => {
  if (!idMap.has(p.id)) {
    idMap.set(p.id, []);
  }
  idMap.get(p.id).push(p);
});

// Find duplicates
const duplicateIds = [];
idMap.forEach((list, id) => {
  if (list.length > 1) {
    duplicateIds.push({ id, count: list.length, platforms: list });
  }
});

console.log(`Found ${duplicateIds.length} duplicate IDs:\n`);

// Keep the best version of each duplicate
const toRemove = new Set();

duplicateIds.forEach(({ id, count, platforms: list }) => {
  console.log(`📋 ID: ${id} (${count} entries):`);

  // Sort by: has rating > has slug > has description
  const sorted = list.sort((a, b) => {
    if (a.rating && !b.rating) return -1;
    if (!a.rating && b.rating) return 1;
    if (a.slug && !b.slug) return -1;
    if (!a.slug && b.slug) return 1;
    if ((a.description?.length || 0) > (b.description?.length || 0)) return -1;
    return 1;
  });

  const keep = sorted[0];
  console.log(`   ✅ Keeping: ${keep.name} (Rating: ${keep.rating || 'N/A'}, Slug: ${keep.slug || 'N/A'})`);

  // Mark others for removal (by checking object reference)
  sorted.slice(1).forEach(p => {
    console.log(`   ❌ Removing: ${p.name} (Rating: ${p.rating || 'N/A'}, Slug: ${p.slug || 'N/A'})`);
    toRemove.add(p);
  });

  console.log('');
});

// Filter out duplicates
const deduplicated = platforms.filter(p => !toRemove.has(p));

console.log(`\n=== SUMMARY ===`);
console.log(`Started with: ${platforms.length}`);
console.log(`Removed: ${toRemove.size}`);
console.log(`Final count: ${deduplicated.length}`);

// Save
fs.writeFileSync('platforms.json', JSON.stringify(deduplicated, null, 2));
console.log('\n✅ Saved to platforms.json');
