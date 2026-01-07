#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Merging new platforms into platforms.json...\n');

// Read existing platforms
const platformsPath = join(__dirname, 'platforms.json');
const existingPlatforms = JSON.parse(readFileSync(platformsPath, 'utf-8'));
console.log(`📊 Current platforms: ${existingPlatforms.length}`);

// Read Vibe Coding platforms
const vibeCodingPath = join(__dirname, '..', 'vibe-coding-platforms.json');
const vibeCodingPlatforms = JSON.parse(readFileSync(vibeCodingPath, 'utf-8'));
console.log(`✨ Vibe Coding platforms to add: ${vibeCodingPlatforms.length}`);

// Read VS Code extensions platforms
const vscodePath = join(__dirname, '..', 'vscode-extensions-platforms.json');
const vscodePlatforms = JSON.parse(readFileSync(vscodePath, 'utf-8'));
console.log(`🔌 VS Code extensions to add: ${vscodePlatforms.length}`);

// Check for duplicates by ID
const existingIds = new Set(existingPlatforms.map(p => p.id));
const duplicatesVibe = vibeCodingPlatforms.filter(p => existingIds.has(p.id));
const duplicatesVscode = vscodePlatforms.filter(p => existingIds.has(p.id));

if (duplicatesVibe.length > 0) {
  console.log(`\n⚠️  Warning: ${duplicatesVibe.length} duplicate IDs found in Vibe Coding:`);
  duplicatesVibe.forEach(p => console.log(`   - ${p.id}: ${p.name}`));
}

if (duplicatesVscode.length > 0) {
  console.log(`\n⚠️  Warning: ${duplicatesVscode.length} duplicate IDs found in VS Code:`);
  duplicatesVscode.forEach(p => console.log(`   - ${p.id}: ${p.name}`));
}

// Filter out duplicates
const newVibeCoding = vibeCodingPlatforms.filter(p => !existingIds.has(p.id));
const newVscode = vscodePlatforms.filter(p => !existingIds.has(p.id));

console.log(`\n✅ New Vibe Coding platforms to add: ${newVibeCoding.length}`);
console.log(`✅ New VS Code platforms to add: ${newVscode.length}`);

// Add timestamps and ensure all required fields
const now = Math.floor(Date.now() / 1000);

const processedVibeCoding = newVibeCoding.map(p => ({
  ...p,
  last_updated: p.last_updated || { _seconds: now, _nanoseconds: 0 },
  viewCount: p.viewCount || 0,
  categorizationStatus: p.categorizationStatus || 'verified'
}));

const processedVscode = newVscode.map(p => ({
  ...p,
  last_updated: p.last_updated || { _seconds: now, _nanoseconds: 0 },
  viewCount: p.viewCount || 0,
  categorizationStatus: p.categorizationStatus || 'verified'
}));

// Merge all platforms
const mergedPlatforms = [
  ...existingPlatforms,
  ...processedVibeCoding,
  ...processedVscode
];

console.log(`\n📈 Total platforms after merge: ${mergedPlatforms.length}`);
console.log(`   Previous: ${existingPlatforms.length}`);
console.log(`   Added: ${processedVibeCoding.length + processedVscode.length}`);

// Create backup
const backupPath = join(__dirname, 'platforms.json.backup-' + Date.now());
writeFileSync(backupPath, JSON.stringify(existingPlatforms, null, 2));
console.log(`\n💾 Backup created: ${backupPath}`);

// Write merged platforms
writeFileSync(platformsPath, JSON.stringify(mergedPlatforms, null, 2));
console.log(`\n✅ Successfully merged platforms into platforms.json`);

// Summary
console.log('\n📋 SUMMARY:');
console.log(`   • Vibe Coding platforms added: ${processedVibeCoding.length}`);
console.log(`   • VS Code extensions added: ${processedVscode.length}`);
console.log(`   • Total new platforms: ${processedVibeCoding.length + processedVscode.length}`);
console.log(`   • Final database size: ${mergedPlatforms.length} platforms`);
console.log(`   • Growth: +${((processedVibeCoding.length + processedVscode.length) / existingPlatforms.length * 100).toFixed(1)}%`);

console.log('\n✨ Merge complete!\n');
