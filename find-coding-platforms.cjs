const platforms = require('./platforms.json');

// Find coding and developer platforms
const coding = platforms.filter(p => {
  const cat = (p.category || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const tags = (p.tags || []).join(' ').toLowerCase();

  return cat.includes('code') || cat.includes('developer') ||
         cat.includes('llm') || cat.includes('agent') ||
         tags.includes('coding') || tags.includes('code') ||
         desc.includes('coding') || desc.includes('developer');
});

coding.sort((a, b) => (b.rating || 0) - (a.rating || 0));

console.log('Top Coding/Developer/LLM Platforms:\n');
coding.slice(0, 20).forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.rating}/5) - ${p.slug}`);
  console.log(`   Category: ${p.category}`);
});

console.log('\n\nAgent Platforms:\n');
const agents = platforms.filter(p => p.category === 'agent-platforms');
agents.sort((a, b) => (b.rating || 0) - (a.rating || 0));
agents.slice(0, 10).forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.rating}/5) - ${p.slug}`);
});
