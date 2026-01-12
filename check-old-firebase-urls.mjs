#!/usr/bin/env node
import { readFileSync } from 'fs';

console.log('🔍 Analyzing Old Firebase URLs\n');

// Load platforms
const platforms = JSON.parse(readFileSync('platforms.json', 'utf-8'));

// Sample of old Firebase URLs from GSC
const oldUrls = [
  '/platform/platform-socialmedia-upgrow',
  '/platform/platform-emailmgmt-convertkit',
  '/platform/platform-deploy-ibm-watsonx',
  '/platform/platform-gaming-ex-human',
  '/platform/platform-emailmgmt-campaignhq',
  '/platform/platform-audiogen-mubert',
  '/platform/platform-videogen-creatify',
  '/platform/platform-cv-betaface',
  '/platform/platform-nlp-opt-meta',
  '/platform/platform-socialmedia-heyday',
  '/platform/platform-videogen-synthesys',
  '/platform/platform-workflow-servicenow',
  '/platform/platform-dataanalysis-sisense',
  '/platform/platform-socialmedia-hootsuite',
  '/platform/platform-textgen-peppertype-tg',
  '/platform/platform-ai-cybersecurity-knowbe4',
  '/platform/platform-specialized-finance-kensho',
  '/platform/platform-autonomous-agents-cogniflow'
];

let foundCount = 0;
let notFoundCount = 0;

console.log('Testing sample of 18 URLs:\n');

oldUrls.forEach(url => {
  // Extract parts from old URL format: /platform/platform-category-name
  const match = url.match(/\/platform\/platform-(.+)$/);
  if (!match) {
    console.log(`❌ Can't parse: ${url}`);
    return;
  }

  // Extract the full slug after "platform-"
  const fullSlug = match[1];
  const parts = fullSlug.split('-');

  // First part is usually category, rest is name
  const category = parts[0];
  const nameSlug = parts.slice(1).join('-');
  const nameParts = nameSlug.split('-');

  // Try to find platform
  const found = platforms.find(p => {
    const pSlug = (p.slug || p.id || '').toLowerCase();
    const pName = p.name.toLowerCase();

    // Try exact slug match
    if (pSlug === nameSlug) return true;

    // Try name match
    const searchName = nameParts.join(' ');
    if (pName.includes(searchName) || searchName.includes(pName)) return true;

    // Try partial slug match
    if (pSlug.includes(nameParts.slice(-1)[0])) return true;

    return false;
  });

  if (found) {
    console.log(`✅ ${nameSlug.padEnd(30)} → ${found.name} (${found.slug})`);
    foundCount++;
  } else {
    console.log(`❌ ${nameSlug.padEnd(30)} → NOT FOUND (would redirect to /)`)
    notFoundCount++;
  }
});

console.log(`\n📊 Results:`);
console.log(`   Found: ${foundCount} (${Math.round(foundCount/oldUrls.length*100)}%)`);
console.log(`   Not Found: ${notFoundCount} (${Math.round(notFoundCount/oldUrls.length*100)}%)`);
console.log(`\n💡 Extrapolated to 697 URLs:`);
console.log(`   ~${Math.round(697 * foundCount/oldUrls.length)} will redirect to real platforms ✅`);
console.log(`   ~${Math.round(697 * notFoundCount/oldUrls.length)} will redirect to homepage (soft 404) ⚠️`);
