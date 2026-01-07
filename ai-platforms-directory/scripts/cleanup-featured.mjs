#!/usr/bin/env node

/**
 * Smart featured cleanup strategy:
 * 1. KEEP big tech featured (ChatGPT, Claude, Gemini, etc.) - they provide credibility
 * 2. UNFLAG most other platforms - these spots should be SOLD
 * 3. Leave a few high-quality platforms featured as examples
 *
 * Pitch: "Get featured alongside ChatGPT, Claude, and Google Gemini"
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const platformsPath = join(__dirname, '../platforms.json');

// KEEP these featured - they're the "anchor" platforms
const ANCHOR_PLATFORMS = [
  'openai',
  'chatgpt',
  'gpt-4',
  'gpt-3',
  'dall-e',
  'google',
  'gemini',
  'bard',
  'palm',
  'anthropic',
  'claude',
  'microsoft copilot',
  'github copilot',
  'midjourney',
  'stable diffusion',
  'perplexity',
  'meta llama',
  'cohere',
  'hugging face'
];

console.log('🔍 Loading platforms...');
const platforms = JSON.parse(readFileSync(platformsPath, 'utf-8'));

const featuredBefore = platforms.filter(p => p.featured).length;

console.log(`\n📊 Current state:`);
console.log(`   Total platforms: ${platforms.length}`);
console.log(`   Featured: ${featuredBefore}`);

let keptCount = 0;
let unflaggedCount = 0;
const keptPlatforms = [];
const unflaggedPlatforms = [];

platforms.forEach(platform => {
  if (!platform.featured) return;

  const nameLower = platform.name.toLowerCase();
  const isAnchor = ANCHOR_PLATFORMS.some(anchor => nameLower.includes(anchor));

  if (isAnchor) {
    // KEEP big tech featured
    keptCount++;
    keptPlatforms.push(platform.name);
  } else {
    // UNFLAG - this spot can be sold
    platform.featured = false;
    unflaggedCount++;
    unflaggedPlatforms.push(platform.name);
  }
});

console.log(`\n✅ KEPT featured (anchor platforms): ${keptCount}`);
keptPlatforms.forEach(name => console.log(`   ✓ ${name}`));

console.log(`\n🚫 UNFLAGGED (can be sold): ${unflaggedCount}`);
console.log(`   (Showing first 20...)`);
unflaggedPlatforms.slice(0, 20).forEach(name => console.log(`   - ${name}`));
if (unflaggedCount > 20) {
  console.log(`   ... and ${unflaggedCount - 20} more`);
}

const featuredAfter = platforms.filter(p => p.featured).length;

console.log(`\n📈 Revenue opportunity:`);
console.log(`   Featured before: ${featuredBefore}`);
console.log(`   Featured after: ${featuredAfter} (anchor platforms)`);
console.log(`   Available to sell: ${unflaggedCount} spots`);
console.log(`   `);
console.log(`   💰 Potential revenue at $300/month:`);
console.log(`      10 paid slots = $3,000/month`);
console.log(`      25 paid slots = $7,500/month`);
console.log(`      50 paid slots = $15,000/month`);

console.log(`\n💡 Sales pitch:`);
console.log(`   "Get featured alongside ChatGPT, Claude, and Google Gemini"`);
console.log(`   "Join ${keptCount} industry-leading AI platforms on our featured list"`);

// Ask for confirmation
console.log(`\n⚠️  This will unflag ${unflaggedCount} platforms.`);
console.log(`   Run with --confirm to proceed`);

if (process.argv.includes('--confirm')) {
  writeFileSync(platformsPath, JSON.stringify(platforms, null, 2), 'utf-8');
  console.log(`\n✅ Saved to platforms.json`);
  console.log(`   ${unflaggedCount} spots now available for monetization!`);
} else {
  console.log(`\n   Add --confirm flag to save changes`);
}
