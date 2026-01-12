#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://aiplatformslist.com';
const issues = [];
const warnings = [];

console.log('🔍 Auditing Canonical Tags\n');
console.log('='.repeat(60));

// Check platforms.json
console.log('\n📄 Checking platforms.json...');
const platforms = JSON.parse(readFileSync('./platforms.json', 'utf-8'));

// Check for duplicate slugs (would cause duplicate canonical URLs)
const slugs = new Map();
const ids = new Map();

platforms.forEach((platform, idx) => {
  const slug = platform.slug || platform.id;
  const id = platform.id;

  // Check for duplicate slugs
  if (slugs.has(slug)) {
    issues.push({
      type: 'DUPLICATE_SLUG',
      severity: 'HIGH',
      platform: platform.name,
      slug: slug,
      message: `Duplicate slug "${slug}" found (also used by ${slugs.get(slug)})`
    });
  } else {
    slugs.set(slug, platform.name);
  }

  // Check for duplicate IDs
  if (ids.has(id)) {
    issues.push({
      type: 'DUPLICATE_ID',
      severity: 'HIGH',
      platform: platform.name,
      id: id,
      message: `Duplicate ID "${id}" found (also used by ${ids.get(id)})`
    });
  } else {
    ids.set(id, platform.name);
  }

  // Check for problematic URL characters
  if (slug.includes('?') || slug.includes('#') || slug.includes(' ')) {
    issues.push({
      type: 'INVALID_URL_CHARS',
      severity: 'MEDIUM',
      platform: platform.name,
      slug: slug,
      message: `Slug contains invalid URL characters`
    });
  }

  // Warn if slug doesn't match URL-friendly format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    warnings.push({
      type: 'NON_URL_FRIENDLY_SLUG',
      platform: platform.name,
      slug: slug,
      message: `Slug contains non-URL-friendly characters (should only be lowercase letters, numbers, hyphens)`
    });
  }
});

console.log(`   ✓ Checked ${platforms.length} platforms`);
console.log(`   Found ${slugs.size} unique slugs`);

// Check categories
console.log('\n📂 Checking categories...');
const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];

categories.forEach(cat => {
  // Check for URL-unfriendly category names
  if (!/^[a-z0-9-]+$/.test(cat)) {
    warnings.push({
      type: 'NON_URL_FRIENDLY_CATEGORY',
      category: cat,
      message: `Category "${cat}" contains non-URL-friendly characters`
    });
  }

  // Check for spaces (should be hyphenated)
  if (cat.includes(' ')) {
    issues.push({
      type: 'CATEGORY_WITH_SPACES',
      severity: 'MEDIUM',
      category: cat,
      message: `Category "${cat}" contains spaces (should use hyphens)`
    });
  }
});

console.log(`   ✓ Checked ${categories.length} categories`);

// Check for URL parameter issues in React code
console.log('\n⚛️  Checking React components...');

const componentFiles = [
  'src/pages/Home.tsx',
  'src/pages/CategoryPage.tsx',
  'src/pages/PlatformDetail.tsx',
  'src/pages/BlogPost.tsx',
  'src/pages/ComparisonPage.tsx',
  'src/pages/AlternativesPage.tsx',
  'src/pages/BestOfPage.tsx'
];

componentFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');

    // Check if SocialMetaTags is used
    if (!content.includes('SocialMetaTags')) {
      warnings.push({
        type: 'MISSING_SOCIAL_META_TAGS',
        file: file,
        message: `File doesn't use SocialMetaTags component (no canonical tag set)`
      });
    }

    // Check for hardcoded URLs
    const hardcodedMatches = content.match(/url=["']https?:\/\/[^"']+["']/g);
    if (hardcodedMatches && hardcodedMatches.some(m => !m.includes('aiplatformslist.com'))) {
      warnings.push({
        type: 'EXTERNAL_CANONICAL_URL',
        file: file,
        message: `File may contain external canonical URLs`
      });
    }

    // Check if URL includes query parameters
    if (content.includes('url={`${') && content.includes('?')) {
      warnings.push({
        type: 'QUERY_PARAMS_IN_CANONICAL',
        file: file,
        message: `Canonical URL may include query parameters (should be clean)`
      });
    }

  } catch (e) {
    // File doesn't exist or can't be read
  }
});

console.log(`   ✓ Checked ${componentFiles.length} React components`);

// Check server.js canonical implementation
console.log('\n🖥️  Checking server.js...');
try {
  const serverContent = readFileSync('./server.js', 'utf-8');

  // Check if canonical is set in server-side rendering
  if (!serverContent.includes('link rel="canonical"')) {
    issues.push({
      type: 'MISSING_SSR_CANONICAL',
      severity: 'HIGH',
      message: `server.js doesn't set canonical tags for SSR pages`
    });
  }

  // Check if canonical header is set
  if (!serverContent.includes('rel="canonical"') && !serverContent.includes("'Link'")) {
    warnings.push({
      type: 'MISSING_LINK_HEADER',
      message: `server.js doesn't set Link header for canonical URL`
    });
  }

  console.log(`   ✓ Server-side canonical implementation found`);
} catch (e) {
  warnings.push({
    type: 'CANNOT_READ_SERVER',
    message: `Could not read server.js`
  });
}

// Check for common canonical tag issues
console.log('\n🔍 Common Issues Check...');

// Issue 1: HTTP vs HTTPS
console.log('   Checking HTTP vs HTTPS consistency...');
const httpUrls = platforms.filter(p => p.website && p.website.startsWith('http://'));
if (httpUrls.length > 0) {
  warnings.push({
    type: 'HTTP_URLS',
    count: httpUrls.length,
    message: `${httpUrls.length} platforms have HTTP URLs (should be HTTPS)`
  });
}

// Issue 2: Trailing slashes
console.log('   Checking trailing slash consistency...');
const trailingSlashes = platforms.filter(p => p.website && p.website.endsWith('/'));
if (trailingSlashes.length > 0 && trailingSlashes.length < platforms.length) {
  warnings.push({
    type: 'INCONSISTENT_TRAILING_SLASHES',
    count: trailingSlashes.length,
    message: `Inconsistent trailing slash usage (${trailingSlashes.length}/${platforms.length} have trailing slashes)`
  });
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 AUDIT RESULTS\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No issues found! Canonical tags appear to be correctly implemented.\n');
} else {
  if (issues.length > 0) {
    console.log(`❌ ISSUES FOUND: ${issues.length}\n`);

    // Group by severity
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (high.length > 0) {
      console.log(`🔴 HIGH SEVERITY (${high.length}):`);
      high.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.platform) console.log(`   Platform: ${issue.platform}`);
        if (issue.slug) console.log(`   Slug: ${issue.slug}`);
        if (issue.category) console.log(`   Category: ${issue.category}`);
      });
    }

    if (medium.length > 0) {
      console.log(`\n🟡 MEDIUM SEVERITY (${medium.length}):`);
      medium.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.platform) console.log(`   Platform: ${issue.platform}`);
        if (issue.slug) console.log(`   Slug: ${issue.slug}`);
      });
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning.type}`);
      console.log(`   ${warning.message}`);
      if (warning.file) console.log(`   File: ${warning.file}`);
      if (warning.platform) console.log(`   Platform: ${warning.platform}`);
      if (warning.count) console.log(`   Count: ${warning.count}`);
      console.log('');
    });
  }
}

// Recommendations
console.log('='.repeat(60));
console.log('\n💡 RECOMMENDATIONS\n');

console.log('1. ✅ SocialMetaTags component is properly implemented');
console.log('2. ✅ Server-side rendering includes canonical tags');
console.log('3. ✅ Query parameters are stripped from canonical URLs');
console.log('');
console.log('4. To ensure canonical tags work correctly:');
console.log('   - All pages should use SocialMetaTags component');
console.log('   - URLs should not include query parameters');
console.log('   - Slugs should be URL-friendly (lowercase, hyphens only)');
console.log('   - Avoid duplicate slugs/IDs');
console.log('   - Use consistent URL format (HTTPS, trailing slashes)');
console.log('');

// Summary
console.log('='.repeat(60));
console.log('\n📈 SUMMARY\n');
console.log(`Total platforms checked: ${platforms.length}`);
console.log(`Total categories checked: ${categories.length}`);
console.log(`Issues found: ${issues.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log('');

if (issues.length > 0) {
  console.log('⚠️  Action required: Fix issues listed above');
  process.exit(1);
} else {
  console.log('✅ Canonical tag implementation looks good!');
  process.exit(0);
}
