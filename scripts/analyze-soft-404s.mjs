#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Analyzing Potential Soft 404 Causes\n');
console.log('='.repeat(60));

const issues = [];
const warnings = [];

// Load platforms
const platforms = JSON.parse(readFileSync('./platforms.json', 'utf-8'));
const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];

console.log('\n📊 Dataset Overview:');
console.log(`   Platforms: ${platforms.length}`);
console.log(`   Categories: ${categories.length}`);

// Check for empty/minimal content platforms
console.log('\n📄 Checking Platform Content...');

let noDescription = 0;
let shortDescription = 0;
let noFeatures = 0;
let minimal = 0;

platforms.forEach(p => {
  if (!p.description) {
    noDescription++;
    if (noDescription <= 5) {
      issues.push({
        type: 'NO_DESCRIPTION',
        platform: p.name,
        url: `/platform/${p.slug || p.id}`,
        message: 'Platform has no description (likely soft 404)'
      });
    }
  } else if (p.description.length < 50) {
    shortDescription++;
    if (shortDescription <= 5) {
      warnings.push({
        type: 'SHORT_DESCRIPTION',
        platform: p.name,
        length: p.description.length,
        message: `Description is very short (${p.description.length} chars)`
      });
    }
  }

  if (!p.features || p.features.length === 0) {
    noFeatures++;
  }

  // Check for minimal content (no description + no features + no tags)
  if (!p.description && (!p.features || p.features.length === 0) && (!p.tags || p.tags.length === 0)) {
    minimal++;
    if (minimal <= 5) {
      issues.push({
        type: 'MINIMAL_CONTENT',
        platform: p.name,
        url: `/platform/${p.slug || p.id}`,
        message: 'Platform has minimal content (no description, features, or tags)'
      });
    }
  }
});

console.log(`   ✓ Platforms without description: ${noDescription}`);
console.log(`   ✓ Platforms with short description (<50 chars): ${shortDescription}`);
console.log(`   ✓ Platforms without features: ${noFeatures}`);
console.log(`   ⚠️  Platforms with minimal content: ${minimal}`);

// Check for empty categories
console.log('\n📂 Checking Category Pages...');

const categoryPlatformCounts = {};
categories.forEach(cat => {
  categoryPlatformCounts[cat] = platforms.filter(p => p.category === cat).length;
});

const emptyCategories = Object.entries(categoryPlatformCounts).filter(([cat, count]) => count === 0);
const thinCategories = Object.entries(categoryPlatformCounts).filter(([cat, count]) => count > 0 && count < 3);

if (emptyCategories.length > 0) {
  console.log(`   ❌ Empty categories: ${emptyCategories.length}`);
  emptyCategories.forEach(([cat, count]) => {
    issues.push({
      type: 'EMPTY_CATEGORY',
      category: cat,
      url: `/category/${cat}`,
      message: `Category has ${count} platforms (likely soft 404)`
    });
  });
} else {
  console.log(`   ✓ No empty categories`);
}

if (thinCategories.length > 0) {
  console.log(`   ⚠️  Thin categories (<3 platforms): ${thinCategories.length}`);
  thinCategories.forEach(([cat, count]) => {
    warnings.push({
      type: 'THIN_CATEGORY',
      category: cat,
      count: count,
      message: `Category has only ${count} platform(s)`
    });
  });
}

// Check for missing content files
console.log('\n📚 Checking Content Files...');

const contentDirs = [
  { dir: 'blog-posts', name: 'Blog Posts' },
  { dir: 'alternatives-content', name: 'Alternatives Pages' },
  { dir: 'comparison-content', name: 'Comparison Pages' },
  { dir: 'bestof-content', name: 'Best-of Pages' },
  { dir: 'landing-content', name: 'Landing Pages' },
  { dir: 'pillar-content', name: 'Pillar Pages' }
];

contentDirs.forEach(({ dir, name }) => {
  if (existsSync(dir)) {
    const files = readdirSync(dir).filter(f => f.endsWith('.json'));
    console.log(`   ✓ ${name}: ${files.length} files`);

    // Check for empty content files
    files.slice(0, 10).forEach(file => {
      const content = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
      if (!content.title || !content.content) {
        warnings.push({
          type: 'EMPTY_CONTENT_FILE',
          file: `${dir}/${file}`,
          message: 'Content file is missing title or content'
        });
      }
    });
  } else {
    warnings.push({
      type: 'MISSING_CONTENT_DIR',
      dir: dir,
      message: `Content directory doesn't exist`
    });
  }
});

// Check for potential URL patterns causing soft 404s
console.log('\n🔗 Checking URL Patterns...');

const potentialSoft404Patterns = [
  '/platform/undefined',
  '/platform/null',
  '/category/undefined',
  '/category/null',
  '/blog/undefined',
  '/compare/undefined',
  '/alternatives/undefined'
];

console.log(`   ℹ️  Potential problem URL patterns:`);
potentialSoft404Patterns.forEach(pattern => {
  console.log(`      - ${pattern} (returns 200 but no content)`);
});

// Print Results
console.log('\n' + '='.repeat(60));
console.log('\n📊 SOFT 404 ANALYSIS RESULTS\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No obvious soft 404 issues found!\n');
} else {
  if (issues.length > 0) {
    console.log(`❌ ISSUES (${issues.length}):\n`);
    issues.slice(0, 10).forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.type}`);
      console.log(`   ${issue.message}`);
      if (issue.platform) console.log(`   Platform: ${issue.platform}`);
      if (issue.category) console.log(`   Category: ${issue.category}`);
      if (issue.url) console.log(`   URL: ${issue.url}`);
      console.log('');
    });
    if (issues.length > 10) {
      console.log(`   ... and ${issues.length - 10} more issues\n`);
    }
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.slice(0, 10).forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning.type}`);
      console.log(`   ${warning.message}`);
      if (warning.platform) console.log(`   Platform: ${warning.platform}`);
      if (warning.category) console.log(`   Category: ${warning.category}`);
      if (warning.count) console.log(`   Count: ${warning.count}`);
      if (warning.file) console.log(`   File: ${warning.file}`);
      console.log('');
    });
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more warnings\n`);
    }
  }
}

// Recommendations
console.log('='.repeat(60));
console.log('\n💡 RECOMMENDATIONS TO FIX SOFT 404S\n');

console.log('1. **Minimal Content Platforms**');
console.log(`   - ${minimal} platforms have minimal content`);
console.log('   - Add proper descriptions (min 100 chars)');
console.log('   - Add features list');
console.log('   - Add tags');
console.log('   - OR: Remove if platform no longer exists');
console.log('');

if (thinCategories.length > 0) {
  console.log('2. **Thin Categories**');
  console.log(`   - ${thinCategories.length} categories have <3 platforms`);
  console.log('   - Consider merging with related categories');
  console.log('   - OR: Add more platforms to category');
  console.log('   - OR: Add rich content to category page');
  console.log('');
}

console.log('3. **Server-Side Handling**');
console.log('   - Return proper 404 status for missing platforms');
console.log('   - Return proper 404 status for empty categories');
console.log('   - Add "No results" pages instead of empty pages');
console.log('   - Set minimum content threshold for indexing');
console.log('');

console.log('4. **Content Enrichment**');
console.log('   - Use AI to generate descriptions for minimal platforms');
console.log('   - Add screenshots/images to platforms');
console.log('   - Add user reviews/ratings');
console.log('   - Add related platforms section');
console.log('');

// Summary
console.log('='.repeat(60));
console.log('\n📈 SUMMARY\n');
console.log(`Total Issues: ${issues.length}`);
console.log(`Total Warnings: ${warnings.length}`);
console.log('');
console.log(`Platforms needing enrichment: ${minimal + noDescription + shortDescription}`);
console.log(`Categories needing attention: ${emptyCategories.length + thinCategories.length}`);
console.log('');

if (minimal > 100) {
  console.log('⚠️  HIGH PRIORITY: Large number of platforms with minimal content');
  console.log(`   This is likely causing many of the 789 soft 404s reported`);
}

console.log('\n' + '='.repeat(60));
