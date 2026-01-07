const fs = require('fs');
const platforms = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

let changes = 0;

// Fix LLM categorization
const llmKeywords = [
  'gpt', 'claude', 'llama', 'alpaca', 'falcon', 'bloom', 'dolly',
  'gemini', 'mistral', 'vicuna', 'wizard', 'cohere', 'palm'
];

platforms.forEach(platform => {
  const name = platform.name?.toLowerCase() || '';
  const desc = platform.description?.toLowerCase() || '';

  // Fix LLMs
  const isLLM = llmKeywords.some(keyword =>
    name.includes(keyword) || desc.includes('language model') || desc.includes(' llm')
  );

  if (isLLM && (platform.category === 'nlp' || platform.category === 'ml-frameworks')) {
    console.log(`Moving ${platform.name} from ${platform.category} → llms`);
    platform.category = 'llms';
    changes++;
  }

  // Fix Code AI
  const isCodeAI = (
    name.includes('copilot') ||
    name.includes('code') && (desc.includes('coding') || desc.includes('code completion')) ||
    name.includes('codeium') ||
    name.includes('tabnine') ||
    name.includes('codex')
  );

  if (isCodeAI && platform.category !== 'code-ai' && platform.category !== 'generative-ai') {
    console.log(`Moving ${platform.name} from ${platform.category} → code-ai`);
    platform.category = 'code-ai';
    changes++;
  }

  // Fix Image Generation
  const isImageGen = (
    name.includes('midjourney') ||
    name.includes('dall-e') ||
    name.includes('dalle') ||
    name.includes('stable diffusion') ||
    name.includes('imagen') ||
    (desc.includes('image generation') || desc.includes('generate images'))
  );

  if (isImageGen && platform.category !== 'image-generation' && platform.category !== 'generative-ai') {
    console.log(`Moving ${platform.name} from ${platform.category} → image-generation`);
    platform.category = 'image-generation';
    changes++;
  }

  // Update outdated model names
  if (platform.name === 'OpenAI GPT-4') {
    console.log(`Updating ${platform.name} → ChatGPT (GPT-4o)`);
    platform.name = 'ChatGPT (GPT-4o)';
    platform.description = platform.description?.replace('GPT-4', 'GPT-4o, GPT-4 Turbo, and o1');
    changes++;
  }
});

// Save changes
fs.writeFileSync('platforms.json', JSON.stringify(platforms, null, 2));

console.log(`\n✅ Fixed ${changes} platforms`);

// Show new distribution
const categoryCounts = {};
platforms.forEach(p => {
  const cat = p.category || 'uncategorized';
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
});

console.log('\n=== NEW CATEGORY DISTRIBUTION ===');
Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`${cat}: ${count}`);
});
