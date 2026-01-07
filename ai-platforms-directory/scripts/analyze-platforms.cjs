const fs = require('fs');
const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

console.log('=== OUTDATED AI MODELS ===');
const outdated = platforms.filter(p =>
  p.name?.includes('GPT-4') ||
  p.name?.includes('GPT-3') ||
  p.description?.includes('GPT-4') ||
  p.description?.includes('GPT-3')
);
outdated.forEach(p => {
  console.log(`- ${p.name} (Category: ${p.category})`);
});

console.log('\n=== CATEGORY DISTRIBUTION ===');
const categoryCounts = {};
platforms.forEach(p => {
  const cat = p.category || 'uncategorized';
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
});
Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`${cat}: ${count}`);
});

console.log('\n=== POTENTIAL MISCLASSIFICATIONS ===');

// Image generation tools
const imageGen = platforms.filter(p => {
  const name = p.name?.toLowerCase() || '';
  const desc = p.description?.toLowerCase() || '';
  return (name.includes('midjourney') ||
    name.includes('dall') ||
    name.includes('stable diffusion') ||
    desc.includes('image generation')) &&
    p.category !== 'image-generation' && p.category !== 'generative-ai';
});
console.log('\nImage Gen in wrong category:');
imageGen.forEach(p => console.log(`  ${p.name} (${p.category})`));

// LLM tools
const llms = platforms.filter(p => {
  const name = p.name?.toLowerCase() || '';
  const desc = p.description?.toLowerCase() || '';
  return (desc.includes('language model') ||
    desc.includes('llm') ||
    name.includes('claude') ||
    name.includes('gemini') ||
    name.includes('gpt')) &&
    p.category !== 'llms' && p.category !== 'generative-ai';
});
console.log('\nLLM tools in wrong category (showing first 15):');
llms.slice(0, 15).forEach(p => console.log(`  ${p.name} (${p.category})`));

// Code AI tools
const codeAI = platforms.filter(p => {
  const name = p.name?.toLowerCase() || '';
  const desc = p.description?.toLowerCase() || '';
  return (name.includes('copilot') ||
    name.includes('code') ||
    desc.includes('code completion') ||
    desc.includes('coding assistant')) &&
    p.category !== 'code-ai' && p.category !== 'generative-ai';
});
console.log('\nCode AI in wrong category (showing first 10):');
codeAI.slice(0, 10).forEach(p => console.log(`  ${p.name} (${p.category})`));

console.log('\n=== STATS ===');
console.log(`Total platforms: ${platforms.length}`);
console.log(`Outdated models: ${outdated.length}`);
console.log(`Miscategorized image-gen: ${imageGen.length}`);
console.log(`Miscategorized LLMs: ${llms.length}`);
console.log(`Miscategorized code-AI: ${codeAI.length}`);
