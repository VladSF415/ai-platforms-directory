#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🔍 Analyzing alternatives-content files for issues\n');

const dir = 'alternatives-content';
const files = readdirSync(dir).filter(f => f.endsWith('.json'));

let emptyCount = 0;
let minimalCount = 0;
const issues = [];

files.forEach(file => {
  try {
    const content = JSON.parse(readFileSync(join(dir, file), 'utf-8'));

    // Check for missing or empty fields
    if (!content.title || !content.alternatives) {
      emptyCount++;
      if (issues.length < 20) {
        issues.push({ file, reason: 'Missing title or alternatives field' });
      }
    } else if (content.alternatives.length === 0) {
      minimalCount++;
      if (issues.length < 20) {
        issues.push({ file, reason: 'Empty alternatives array' });
      }
    } else if (content.alternatives.length < 3) {
      minimalCount++;
      if (issues.length < 20) {
        issues.push({ file, reason: `Only ${content.alternatives.length} alternatives` });
      }
    }
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});

console.log(`📊 Results:`);
console.log(`   Total files: ${files.length}`);
console.log(`   Empty/missing data: ${emptyCount}`);
console.log(`   Minimal content (<3 alternatives): ${minimalCount}`);
console.log(`   Total issues: ${emptyCount + minimalCount}\n`);

if (issues.length > 0) {
  console.log('⚠️  Files with issues (first 20):\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.file}`);
    console.log(`   ${issue.reason}\n`);
  });
}

console.log('✅ Analysis complete');
