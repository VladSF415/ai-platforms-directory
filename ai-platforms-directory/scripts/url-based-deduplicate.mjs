import fs from 'fs';

const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

console.log(`🔄 Starting URL-based deduplication...`);
console.log(`Initial platform count: ${platforms.length}\n`);

// Extract domain from URL
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return null;
  }
}

// Normalize platform names for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[™®©]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/version\s+\d+(\.\d+)?/i, '')
    .replace(/v\d+(\.\d+)?/i, '')
    .replace(/\d+(\.\d+)?$/i, '')
    .trim();
}

// Check if two platforms are the same product
function isSameProduct(p1, p2) {
  const n1 = normalizeName(p1.name);
  const n2 = normalizeName(p2.name);

  // Exact match after normalization
  if (n1 === n2) return true;

  // One contains the other (ignoring common suffixes)
  const cleanN1 = n1.replace(/\s+(api|platform|ai|labs?|tool|app)$/i, '');
  const cleanN2 = n2.replace(/\s+(api|platform|ai|labs?|tool|app)$/i, '');

  if (cleanN1 && cleanN2 && (cleanN1.includes(cleanN2) || cleanN2.includes(cleanN1))) {
    return true;
  }

  return false;
}

// Group platforms by domain
const domainMap = new Map();

platforms.forEach(p => {
  if (!p.name) return;

  const url = p.url || p.website;
  const domain = extractDomain(url);

  if (domain) {
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain).push(p);
  }
});

// Special handling rules
const specialDomains = {
  'github.com': 'SKIP', // Each GitHub repo is a different tool
  'arxiv.org': 'SKIP',  // Each paper is different
  'papers.neurips.cc': 'SKIP',
  'openreview.net': 'SKIP',
};

// Specific duplicate groups to consolidate
const manualDuplicateGroups = {
  // Pika Labs - keep the main one
  'pika.art': {
    keepName: 'Pika Labs',
    reason: 'Multiple versions of same product'
  },

  // Cognition AI (Devin) - keep one
  'cognition.ai': {
    keepName: 'Cognition AI',
    reason: 'Multiple entries for Devin AI coding assistant'
  },

  // Replicate - keep main platform, remove variations
  'replicate.com': {
    keepName: 'Replicate',
    reason: 'Multiple entries for same ML platform'
  },

  // ElevenLabs - keep main platform
  'elevenlabs.io': {
    keepName: 'ElevenLabs',
    reason: 'Multiple entries for same voice AI platform'
  },

  // Leonardo AI - keep main platform
  'leonardo.ai': {
    keepName: 'Leonardo AI',
    reason: 'Multiple versions of same image generation tool'
  },

  // Runway ML - keep main platform
  'runwayml.com': {
    keepName: 'Runway ML',
    reason: 'Multiple Gen-3 versions'
  },

  // DeepSeek - keep main platform
  'deepseek.com': {
    keepName: 'DeepSeek',
    reason: 'Multiple versions'
  },
};

// Score a platform (higher is better to keep)
function scorePlatform(p) {
  let score = 0;

  // Featured platforms are highly preferred
  if (p.featured) score += 1000;

  // Rating is important
  if (p.rating) score += parseFloat(p.rating) * 100;

  // Has a proper slug
  if (p.slug && p.slug !== p.id) score += 50;

  // Description length (more detailed is better)
  if (p.description) score += Math.min(p.description.length / 10, 50);

  // Has more complete data
  if (p.category) score += 10;
  if (p.added_date || p.created_at) score += 10;
  if (p.clicks) score += 5;

  return score;
}

// Find best platform from a list
function findBest(platformList, keepName = null) {
  if (platformList.length === 1) return platformList[0];

  // If we have a specific name to keep, find it
  if (keepName) {
    const exact = platformList.find(p =>
      normalizeName(p.name) === normalizeName(keepName)
    );
    if (exact) return exact;

    // Find closest match
    const closest = platformList.find(p =>
      normalizeName(p.name).includes(normalizeName(keepName).split(' ')[0])
    );
    if (closest) return closest;
  }

  // Score all platforms and pick the best
  const scored = platformList.map(p => ({
    platform: p,
    score: scorePlatform(p)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored[0].platform;
}

// Process duplicates
const toRemove = new Set();
let duplicateGroupsProcessed = 0;
let platformsRemoved = 0;

console.log('=== PROCESSING URL-BASED DUPLICATES ===\n');

domainMap.forEach((platformList, domain) => {
  // Skip if only one platform
  if (platformList.length <= 1) return;

  // Skip special domains
  if (specialDomains[domain] === 'SKIP') {
    console.log(`⏭️  Skipping ${domain} (${platformList.length} entries) - Each entry is a different tool`);
    return;
  }

  // Check if this is a manual duplicate group
  const manualRule = manualDuplicateGroups[domain];

  if (manualRule) {
    console.log(`\n🔧 ${domain} (${platformList.length} entries) - ${manualRule.reason}`);

    const keep = findBest(platformList, manualRule.keepName);
    console.log(`   ✅ Keeping: ${keep.name} (ID: ${keep.id})`);

    platformList.forEach(p => {
      if (p.id !== keep.id) {
        console.log(`   ❌ Removing: ${p.name} (ID: ${p.id})`);
        toRemove.add(p.id);
        platformsRemoved++;
      }
    });

    duplicateGroupsProcessed++;
  } else {
    // Auto-detect if these are the same product
    const groups = [];
    const processed = new Set();

    platformList.forEach(p1 => {
      if (processed.has(p1.id)) return;

      const group = [p1];
      processed.add(p1.id);

      platformList.forEach(p2 => {
        if (p1.id === p2.id || processed.has(p2.id)) return;

        if (isSameProduct(p1, p2)) {
          group.push(p2);
          processed.add(p2.id);
        }
      });

      if (group.length > 1) {
        groups.push(group);
      }
    });

    if (groups.length > 0) {
      console.log(`\n🔍 ${domain} (${platformList.length} entries) - Found ${groups.length} duplicate groups`);

      groups.forEach(group => {
        const keep = findBest(group);
        console.log(`   ✅ Keeping: ${keep.name} (ID: ${keep.id}, Rating: ${keep.rating || 'N/A'})`);

        group.forEach(p => {
          if (p.id !== keep.id) {
            console.log(`   ❌ Removing: ${p.name} (ID: ${p.id})`);
            toRemove.add(p.id);
            platformsRemoved++;
          }
        });

        duplicateGroupsProcessed++;
      });
    }
  }
});

// Special case: Claude/Anthropic across different domains
console.log('\n\n=== SPECIAL CASE: CLAUDE/ANTHROPIC ===\n');

const claudePlatforms = platforms.filter(p => {
  const url = (p.url || p.website || '').toLowerCase();
  const name = (p.name || '').toLowerCase();

  return (url.includes('anthropic') || url.includes('claude.ai') ||
          name.includes('claude') || name.includes('anthropic')) &&
         !toRemove.has(p.id);
});

console.log(`Found ${claudePlatforms.length} Claude/Anthropic platforms:`);

if (claudePlatforms.length > 1) {
  // Group by whether they're the same product
  const mainClaudeGroup = [];
  const claudeApiGroup = [];
  const claudeDesktopGroup = [];

  claudePlatforms.forEach(p => {
    const name = p.name.toLowerCase();

    if (name.includes('desktop')) {
      claudeDesktopGroup.push(p);
    } else if (name.includes('api') || name.includes('console')) {
      claudeApiGroup.push(p);
    } else {
      mainClaudeGroup.push(p);
    }
  });

  // Keep best from each group
  const groups = [
    { name: 'Main Claude', platforms: mainClaudeGroup },
    { name: 'Claude API', platforms: claudeApiGroup },
    { name: 'Claude Desktop', platforms: claudeDesktopGroup },
  ];

  groups.forEach(({ name, platforms: group }) => {
    if (group.length === 0) return;

    console.log(`\n📦 ${name} (${group.length} entries):`);

    if (group.length > 1) {
      const keep = findBest(group);
      console.log(`   ✅ Keeping: ${keep.name} (ID: ${keep.id})`);

      group.forEach(p => {
        if (p.id !== keep.id) {
          console.log(`   ❌ Removing: ${p.name} (ID: ${p.id})`);
          toRemove.add(p.id);
          platformsRemoved++;
        }
      });

      duplicateGroupsProcessed++;
    } else {
      console.log(`   ✅ Keeping: ${group[0].name} (ID: ${group[0].id}) - Only one entry`);
    }
  });
}

// Special case: Gemini (but keep AssemblyAI Gemini separate)
console.log('\n\n=== SPECIAL CASE: GEMINI ===\n');

const geminiPlatforms = platforms.filter(p => {
  const name = (p.name || '').toLowerCase();
  return name.includes('gemini') && !toRemove.has(p.id);
});

console.log(`Found ${geminiPlatforms.length} Gemini platforms:`);

if (geminiPlatforms.length > 1) {
  // Separate Google Gemini from AssemblyAI Gemini
  const googleGemini = geminiPlatforms.filter(p => {
    const url = (p.url || p.website || '').toLowerCase();
    return url.includes('google') || url.includes('gemini.google');
  });

  const assemblyGemini = geminiPlatforms.filter(p => {
    const url = (p.url || p.website || '').toLowerCase();
    return url.includes('assemblyai');
  });

  console.log(`\n📦 Google Gemini (${googleGemini.length} entries):`);
  if (googleGemini.length > 1) {
    const keep = findBest(googleGemini);
    console.log(`   ✅ Keeping: ${keep.name} (ID: ${keep.id})`);

    googleGemini.forEach(p => {
      if (p.id !== keep.id) {
        console.log(`   ❌ Removing: ${p.name} (ID: ${p.id})`);
        toRemove.add(p.id);
        platformsRemoved++;
      }
    });
    duplicateGroupsProcessed++;
  } else if (googleGemini.length === 1) {
    console.log(`   ✅ Keeping: ${googleGemini[0].name} (ID: ${googleGemini[0].id}) - Only one entry`);
  }

  if (assemblyGemini.length > 0) {
    console.log(`\n📦 AssemblyAI Gemini (${assemblyGemini.length} entries):`);
    console.log(`   ✅ Keeping: ${assemblyGemini[0].name} (ID: ${assemblyGemini[0].id}) - Different product`);
  }
}

// Apply deduplication
const deduplicated = platforms.filter(p => !toRemove.has(p.id));

console.log(`\n\n=== SUMMARY ===`);
console.log(`Initial platforms: ${platforms.length}`);
console.log(`Duplicate groups processed: ${duplicateGroupsProcessed}`);
console.log(`Platforms removed: ${platformsRemoved}`);
console.log(`Final count: ${deduplicated.length}`);
console.log(`Reduction: ${((platformsRemoved / platforms.length) * 100).toFixed(1)}%`);

// Save backup
fs.writeFileSync('platforms.before-url-dedup.json', JSON.stringify(platforms, null, 2));
console.log('\n✅ Backup saved to platforms.before-url-dedup.json');

// Save deduplicated
fs.writeFileSync('platforms.json', JSON.stringify(deduplicated, null, 2));
console.log('✅ Deduplicated platforms saved to platforms.json');

console.log('\n🎉 URL-based deduplication complete!');
