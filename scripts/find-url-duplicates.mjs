import fs from 'fs';

const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

console.log('🔍 Finding duplicates by URL (domain-based)...\n');

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

// Group by domain
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

// Find duplicates
const duplicates = [];
let totalDuplicates = 0;

domainMap.forEach((platforms, domain) => {
  if (platforms.length > 1) {
    duplicates.push({ domain, platforms });
    totalDuplicates += platforms.length - 1;
  }
});

// Sort by number of duplicates
duplicates.sort((a, b) => b.platforms.length - a.platforms.length);

console.log('=== URL-BASED DUPLICATES ===\n');

duplicates.forEach(({ domain, platforms }) => {
  console.log(`🌐 ${domain} (${platforms.length} entries):`);
  platforms.forEach(p => {
    console.log(`   - ${p.name}`);
    console.log(`     ID: ${p.id}`);
    console.log(`     Category: ${p.category}`);
    console.log(`     Featured: ${p.featured ? 'YES' : 'no'}`);
    console.log(`     Rating: ${p.rating || 'N/A'}`);
    console.log(`     URL: ${p.url || p.website || 'N/A'}`);
    console.log('');
  });
  console.log('---\n');
});

console.log(`\n📊 SUMMARY:`);
console.log(`Total platforms: ${platforms.length}`);
console.log(`Duplicate domains: ${duplicates.length}`);
console.log(`Duplicate entries: ${totalDuplicates}`);
console.log(`After URL deduplication: ${platforms.length - totalDuplicates} platforms`);

// Specific checks
console.log('\n\n=== SPECIFIC PLATFORM CHECKS ===\n');

// Claude/Anthropic
const anthropicPlatforms = platforms.filter(p => {
  const url = p.url || p.website || '';
  const name = p.name || '';
  return url.toLowerCase().includes('anthropic') ||
         url.toLowerCase().includes('claude.ai') ||
         name.toLowerCase().includes('claude') ||
         name.toLowerCase().includes('anthropic');
});

console.log(`🤖 Claude/Anthropic platforms (${anthropicPlatforms.length}):`);
anthropicPlatforms.forEach(p => {
  console.log(`   - ${p.name} (${p.id})`);
  console.log(`     URL: ${p.url || p.website}`);
});

// Gemini
const geminiPlatforms = platforms.filter(p => {
  const url = p.url || p.website || '';
  const name = p.name || '';
  return url.toLowerCase().includes('gemini') ||
         name.toLowerCase().includes('gemini');
});

console.log(`\n💎 Gemini platforms (${geminiPlatforms.length}):`);
geminiPlatforms.forEach(p => {
  console.log(`   - ${p.name} (${p.id})`);
  console.log(`     URL: ${p.url || p.website}`);
});
