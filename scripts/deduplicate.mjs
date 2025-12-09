import fs from 'fs';

const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

console.log(`Starting with ${platforms.length} platforms...\n`);

// Manual deduplication rules - keep the BEST version
const deduplicationRules = {
  // Keep the one with rating, featured status, or better data
  'tensorflow': 'tensorflow', // Keep the newer one with rating
  'github copilot': 'github-copilot', // Keep the one with rating
  'chatgpt (gpt-4o)': 'openai-gpt4', // Keep the better one
  'matlab automated visual inspection': 'automated-visual-inspection-matlab',
  'aware abis': 'aware-abis',
  'hugging face': 'hugging-face', // Keep the featured one with rating
  'dataturks': 'dataturks',
  'hugging face transformers': 'hugging-face-transformers', // Keep the higher rated one
  'meta llama 3': 'llama-3-meta', // Keep the higher rated one
  'midjourney': 'midjourney', // Keep the one with proper slug
  'modal': 'modal',
  'pika labs': 'pika-labs',
  'scikit-learn': 'scikit-learn',
  'suno ai': 'suno-ai',
  'ultralytics yolo': 'ultralytics-yolo',
  'weights & biases': 'wandb',
  'cognigy.ai': 'cognigy-ai',
  'dust.tt': 'dust-tt',
  'luma ai': 'luma-ai',
};

// Find duplicates by name
const nameMap = new Map();
const toRemove = new Set();

platforms.forEach(p => {
  if (!p.name) {
    console.log(`⚠️  Removing platform without name: ID=${p.id}`);
    toRemove.add(p.id);
    return;
  }

  const nameLower = p.name.toLowerCase().trim();

  if (!nameMap.has(nameLower)) {
    nameMap.set(nameLower, []);
  }
  nameMap.get(nameLower).push(p);
});

// Process duplicates
nameMap.forEach((list, name) => {
  if (list.length > 1) {
    console.log(`\n📋 Processing: ${name} (${list.length} entries)`);

    // Keep the ID specified in rules, or pick the best one
    const keepId = deduplicationRules[name];

    if (keepId) {
      const keepPlatform = list.find(p => p.id === keepId || p.slug === keepId);
      if (keepPlatform) {
        console.log(`   ✅ Keeping: ${keepPlatform.id}`);
        list.forEach(p => {
          if (p.id !== keepPlatform.id) {
            console.log(`   ❌ Removing: ${p.id}`);
            toRemove.add(p.id);
          }
        });
      } else {
        // Fallback: keep the best one automatically
        pickBest(list, toRemove);
      }
    } else {
      // Auto-pick the best one
      pickBest(list, toRemove);
    }
  }
});

function pickBest(list, toRemove) {
  // Sort by: featured > rating > has slug > has description length
  const sorted = list.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    if ((a.rating || 0) > (b.rating || 0)) return -1;
    if ((a.rating || 0) < (b.rating || 0)) return 1;
    if (a.slug && !b.slug) return -1;
    if (!a.slug && b.slug) return 1;
    if ((a.description?.length || 0) > (b.description?.length || 0)) return -1;
    return 1;
  });

  const keep = sorted[0];
  console.log(`   ✅ Auto-keeping best: ${keep.id} (Featured: ${keep.featured ? 'YES' : 'no'}, Rating: ${keep.rating || 'N/A'})`);

  sorted.slice(1).forEach(p => {
    console.log(`   ❌ Removing: ${p.id}`);
    toRemove.add(p.id);
  });
}

// Remove duplicates
const deduplicated = platforms.filter(p => !toRemove.has(p.id));

console.log(`\n\n=== SUMMARY ===`);
console.log(`Started with: ${platforms.length} platforms`);
console.log(`Removed: ${toRemove.size} duplicates`);
console.log(`Final count: ${deduplicated.length} platforms`);

// Save backup
fs.writeFileSync('platforms.backup.json', JSON.stringify(platforms, null, 2));
console.log('\n✅ Backup saved to platforms.backup.json');

// Save deduplicated
fs.writeFileSync('platforms.json', JSON.stringify(deduplicated, null, 2));
console.log('✅ Deduplicated platforms saved to platforms.json');

console.log('\n🎉 Deduplication complete!');
