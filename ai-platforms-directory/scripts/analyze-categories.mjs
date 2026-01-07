#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platformsPath = path.join(__dirname, '..', 'platforms.json');
const platforms = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));

// Get all unique categories and subcategories
const categories = new Map();
const subcategories = new Set();
const tags = new Map();

platforms.forEach(p => {
  const cat = p.category || 'uncategorized';
  if (!categories.has(cat)) {
    categories.set(cat, 0);
  }
  categories.set(cat, categories.get(cat) + 1);

  // Collect subcategories
  if (p.subcategories && Array.isArray(p.subcategories)) {
    p.subcategories.forEach(sub => subcategories.add(sub));
  }

  // Collect tags
  if (p.tags && Array.isArray(p.tags)) {
    p.tags.forEach(tag => {
      if (!tags.has(tag)) {
        tags.set(tag, 0);
      }
      tags.set(tag, tags.get(tag) + 1);
    });
  }
});

console.log('='.repeat(60));
console.log('CATEGORY ANALYSIS FOR PILLAR PAGE GENERATION');
console.log('='.repeat(60));

console.log('\n=== MAIN CATEGORIES ===');
const sortedCategories = Array.from(categories.entries())
  .sort((a, b) => b[1] - a[1]);

sortedCategories.forEach(([cat, count]) => {
  console.log(`${cat.padEnd(35)} ${count.toString().padStart(4)} platforms`);
});

console.log('\n' + '='.repeat(60));
console.log(`Total main categories: ${categories.size}`);
console.log(`Total unique subcategories: ${subcategories.size}`);
console.log(`Total platforms: ${platforms.length}`);
console.log('='.repeat(60));

console.log('\n=== TOP 30 SUBCATEGORIES ===');
Array.from(subcategories).slice(0, 30).forEach((sub, i) => {
  console.log(`${(i + 1).toString().padStart(3)}. ${sub}`);
});

console.log('\n=== TOP 30 POPULAR TAGS (for cluster pages) ===');
Array.from(tags.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .forEach(([tag, count], i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${tag.padEnd(30)} (${count} platforms)`);
  });

console.log('\n' + '='.repeat(60));
console.log('RECOMMENDED PILLAR PAGES:');
console.log('='.repeat(60));
console.log(`Main categories: ${categories.size} pillar pages`);
console.log(`Top subcategories: ~20-30 pillar pages`);
console.log(`TOTAL: ~${categories.size + 25} pillar pages\n`);
