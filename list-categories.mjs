#!/usr/bin/env node
import { readFileSync } from 'fs';

const platforms = JSON.parse(readFileSync('platforms.json', 'utf-8'));

const cats = {};
platforms.forEach(p => {
  const cat = p.category || 'uncategorized';
  cats[cat] = (cats[cat] || 0) + 1;
});

const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

console.log(`Total categories: ${Object.keys(cats).length}\n`);
console.log('All categories:');
sorted.forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});
