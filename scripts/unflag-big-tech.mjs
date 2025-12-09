#!/usr/bin/env node

/**
 * Remove featured status from big tech companies
 * These platforms don't need exposure and would never pay for featured placement
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const platformsPath = join(__dirname, '../platforms.json');

// Big tech keywords - if platform name contains these, unflag them
const BIG_TECH_KEYWORDS = [
  'openai',
  'chatgpt',
  'gpt-4',
  'gpt-3',
  'dall-e',
  'whisper',
  'google',
  'gemini',
  'bard',
  'palm',
  'bert',
  'automl',
  'dialogflow',
  'anthropic',
  'claude',
  'microsoft',
  'copilot',
  'bing',
  'power bi',
  'azure',
  'meta',
  'llama',
  'metaflow',
  'adobe',
  'firefly',
  'amazon',
  'aws',
  'sagemaker',
  'comprehend',
  'translate',
  'apple',
  'github',
  'midjourney',
  'stable diffusion',
  'hugging face',
  'cohere',
  'ai21'
];

console.log('🔍 Loading platforms...');
const platforms = JSON.parse(readFileSync(platformsPath, 'utf-8'));

const featuredBefore = platforms.filter(p => p.featured).length;

console.log(`\n📊 Current state:`);
console.log(`   Total platforms: ${platforms.length}`);
console.log(`   Featured: ${featuredBefore}`);

let unflaggedCount = 0;
const unflaggedPlatforms = [];

platforms.forEach(platform => {
  if (!platform.featured) return;

  const nameLower = platform.name.toLowerCase();
  const isBigTech = BIG_TECH_KEYWORDS.some(keyword => nameLower.includes(keyword));

  if (isBigTech) {
    platform.featured = false;
    unflaggedCount++;
    unflaggedPlatforms.push(platform.name);
  }
});

console.log(`\n🚫 Unflagged ${unflaggedCount} big tech platforms:`);
unflaggedPlatforms.forEach(name => console.log(`   - ${name}`));

const featuredAfter = platforms.filter(p => p.featured).length;

console.log(`\n✅ Results:`);
console.log(`   Featured before: ${featuredBefore}`);
console.log(`   Featured after: ${featuredAfter}`);
console.log(`   Freed up: ${unflaggedCount} premium spots`);
console.log(`   Revenue potential: ${unflaggedCount} × $200-500/month = $${unflaggedCount * 200}-${unflaggedCount * 500}/month`);

// Save updated platforms
writeFileSync(platformsPath, JSON.stringify(platforms, null, 2), 'utf-8');

console.log(`\n💾 Saved to platforms.json`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Review the ${featuredAfter} remaining featured platforms`);
console.log(`   2. Consider setting up tiered pricing (homepage vs category featured)`);
console.log(`   3. Start selling the ${unflaggedCount} freed spots to smaller companies`);
