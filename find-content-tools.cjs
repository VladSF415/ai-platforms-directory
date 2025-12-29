const platforms = require('./platforms.json');

// Look for specific content creation platforms
const targetNames = [
  'jasper', 'copy.ai', 'chatgpt', 'claude', 'writesonic', 'rytr',
  'grammarly', 'quillbot', 'notion ai', 'wordtune', 'writer',
  'contentbot', 'shortly', 'peppertype', 'copysmith', 'anyword',
  'frase', 'surfer seo', 'clearscope', 'marketmuse', 'copy ai',
  'hemingway', 'prowritingaid'
];

const contentTools = platforms.filter(p => {
  const name = (p.name || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const features = (p.features || []).join(' ').toLowerCase();

  // Check if name matches any target
  const nameMatch = targetNames.some(target => name.includes(target));

  // Or if description mentions content creation/marketing/copywriting
  const isContentTool = desc.includes('content creation') ||
                        desc.includes('content marketing') ||
                        desc.includes('copywriting') ||
                        desc.includes('blog writing') ||
                        desc.includes('marketing content') ||
                        desc.includes('social media content') ||
                        features.includes('content generation') ||
                        features.includes('blog post') ||
                        features.includes('marketing copy');

  return (nameMatch || isContentTool) && p.rating >= 3.5;
});

// Sort by rating
contentTools.sort((a, b) => (b.rating || 0) - (a.rating || 0));

console.log(`Found ${contentTools.length} content creation tools\n`);

contentTools.slice(0, 15).forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.rating}/5) - ${p.pricing}`);
  console.log(`   Slug: ${p.slug}`);
  console.log(`   ${p.description.substring(0, 120)}...`);
  console.log('');
});

console.log('\n=== SELECTED TOP 10 FOR BLOG POST ===\n');
const selected = contentTools.slice(0, 10);
selected.forEach((p, i) => {
  console.log(`${i+1}. ${p.name} - /platform/${p.slug}`);
});

console.log('\n=== FULL JSON DATA ===\n');
console.log(JSON.stringify(selected, null, 2));
