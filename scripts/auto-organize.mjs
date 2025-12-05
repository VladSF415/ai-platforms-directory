#!/usr/bin/env node
/**
 * AI Platforms Auto-Organizer
 *
 * Features:
 * - Detect duplicate platforms
 * - Find miscategorized platforms
 * - Enrich platform data via web scraping
 * - Auto-fix common issues
 * - Generate detailed report
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  similarity_threshold: 0.8, // 80% similarity = duplicate
  auto_fix: process.argv.includes('--fix'),
  scrape_web: process.argv.includes('--scrape'),
  verbose: process.argv.includes('--verbose'),
  max_scrape: 50 // Limit web scraping to avoid rate limits
};

// Valid categories with keywords
const CATEGORIES = {
  'ml-frameworks': ['tensorflow', 'pytorch', 'keras', 'scikit', 'machine learning', 'deep learning', 'neural network', 'model training'],
  'generative-ai': ['gpt', 'generate', 'generation', 'stable diffusion', 'dall-e', 'midjourney', 'text-to-image', 'image generation'],
  'computer-vision': ['vision', 'image recognition', 'object detection', 'facial recognition', 'ocr', 'image processing', 'opencv'],
  'nlp': ['language', 'nlp', 'natural language', 'text analysis', 'sentiment', 'translation', 'chatbot', 'llm', 'language model'],
  'llms': ['llm', 'large language', 'gpt', 'claude', 'palm', 'llama', 'language model', 'conversational ai'],
  'image-generation': ['image generation', 'text-to-image', 'ai art', 'dall-e', 'midjourney', 'stable diffusion', 'art generator'],
  'analytics-bi': ['analytics', 'business intelligence', 'data visualization', 'dashboards', 'metrics', 'reporting'],
  'code-ai': ['code', 'programming', 'developer', 'copilot', 'coding assistant', 'code generation']
};

// Load platforms
let platforms = [];
try {
  const data = readFileSync(CONFIG.platforms_path, 'utf-8');
  platforms = JSON.parse(data);
  console.log(`📊 Loaded ${platforms.length} platforms\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

// Utility: Calculate string similarity (Levenshtein distance)
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// 1. DUPLICATE DETECTION
function findDuplicates() {
  console.log('🔍 Scanning for duplicates...\n');

  const duplicates = [];
  const seen = new Set();

  for (let i = 0; i < platforms.length; i++) {
    if (seen.has(i)) continue;

    const platform1 = platforms[i];
    const group = [platform1];

    for (let j = i + 1; j < platforms.length; j++) {
      if (seen.has(j)) continue;

      const platform2 = platforms[j];

      // Check name similarity
      const nameSim = stringSimilarity(platform1.name, platform2.name);

      // Check URL similarity (if exists)
      const url1 = platform1.url || platform1.website || '';
      const url2 = platform2.url || platform2.website || '';
      const urlMatch = url1 && url2 && (url1.includes(url2) || url2.includes(url1));

      if (nameSim >= CONFIG.similarity_threshold || urlMatch) {
        group.push(platform2);
        seen.add(j);
      }
    }

    if (group.length > 1) {
      duplicates.push(group);
    }
  }

  return duplicates;
}

// 2. CATEGORY VALIDATION
function findMiscategorized() {
  console.log('🏷️  Checking categorization...\n');

  const suggestions = [];

  platforms.forEach(platform => {
    const text = `${platform.name} ${platform.description || ''} ${(platform.tags || []).join(' ')}`.toLowerCase();

    // Score each category
    const scores = {};
    Object.entries(CATEGORIES).forEach(([category, keywords]) => {
      scores[category] = keywords.filter(kw => text.includes(kw)).length;
    });

    // Find best match
    const bestCategory = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      [0];

    const currentCategory = platform.category;
    const suggestedCategory = bestCategory[0];
    const confidence = bestCategory[1];

    // If suggested category is different and has good confidence
    if (suggestedCategory !== currentCategory && confidence >= 2) {
      suggestions.push({
        platform: platform.name,
        current: currentCategory,
        suggested: suggestedCategory,
        confidence,
        id: platform.id
      });
    }
  });

  return suggestions;
}

// 3. DATA QUALITY CHECKS
function findDataIssues() {
  console.log('🔧 Checking data quality...\n');

  const issues = {
    missing_description: [],
    missing_url: [],
    missing_tags: [],
    missing_pricing: [],
    no_slug: [],
    invalid_category: []
  };

  const validCategories = Object.keys(CATEGORIES);

  platforms.forEach(platform => {
    if (!platform.description || platform.description.length < 20) {
      issues.missing_description.push(platform.name);
    }

    if (!platform.url && !platform.website) {
      issues.missing_url.push(platform.name);
    }

    if (!platform.tags || platform.tags.length === 0) {
      issues.missing_tags.push(platform.name);
    }

    if (!platform.pricing) {
      issues.missing_pricing.push(platform.name);
    }

    if (!platform.slug) {
      issues.no_slug.push(platform.name);
    }

    if (!validCategories.includes(platform.category)) {
      issues.invalid_category.push({
        name: platform.name,
        category: platform.category
      });
    }
  });

  return issues;
}

// 4. WEB SCRAPING (Basic - expand with actual scraping)
async function enrichPlatforms() {
  if (!CONFIG.scrape_web) return [];

  console.log('🌐 Enriching platform data from web...\n');
  console.log('⚠️  Note: Web scraping is limited to avoid rate limits\n');

  const enriched = [];
  const needEnrichment = platforms
    .filter(p => !p.description || p.description.length < 50)
    .slice(0, CONFIG.max_scrape);

  for (const platform of needEnrichment) {
    const url = platform.url || platform.website;
    if (!url) continue;

    try {
      console.log(`  Fetching: ${platform.name}...`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIDirectoryBot/1.0)'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Extract meta description
      const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);

      const description = metaDesc?.[1] || ogDesc?.[1];

      if (description && description.length > platform.description?.length) {
        enriched.push({
          id: platform.id,
          name: platform.name,
          old_desc: platform.description,
          new_desc: description
        });

        if (CONFIG.auto_fix) {
          platform.description = description;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      if (CONFIG.verbose) {
        console.log(`  ⚠️  Failed to fetch ${platform.name}: ${error.message}`);
      }
    }
  }

  return enriched;
}

// 5. AUTO-FIX COMMON ISSUES
function autoFixIssues() {
  if (!CONFIG.auto_fix) return;

  console.log('🔧 Auto-fixing common issues...\n');

  let fixed = 0;

  platforms.forEach(platform => {
    // Generate slug if missing
    if (!platform.slug && platform.name) {
      platform.slug = platform.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      fixed++;
    }

    // Normalize URL field
    if (platform.url && !platform.website) {
      platform.website = platform.url;
    } else if (platform.website && !platform.url) {
      platform.url = platform.website;
    }

    // Add empty arrays for missing fields
    if (!platform.tags) {
      platform.tags = [];
    }

    if (!platform.features) {
      platform.features = [];
    }
  });

  console.log(`  ✅ Fixed ${fixed} issues\n`);
}

// MAIN EXECUTION
async function main() {
  console.log('🤖 AI Platforms Auto-Organizer\n');
  console.log('=' .repeat(50) + '\n');

  // Run all checks
  const duplicates = findDuplicates();
  const miscategorized = findMiscategorized();
  const dataIssues = findDataIssues();
  const enriched = await enrichPlatforms();

  // Auto-fix if requested
  if (CONFIG.auto_fix) {
    autoFixIssues();
  }

  // GENERATE REPORT
  console.log('\n' + '='.repeat(50));
  console.log('📋 REPORT\n');

  // Duplicates
  if (duplicates.length > 0) {
    console.log(`🔴 Found ${duplicates.length} duplicate groups:\n`);
    duplicates.forEach((group, i) => {
      console.log(`  Group ${i + 1}:`);
      group.forEach(p => console.log(`    - ${p.name} (${p.id})`));
      console.log();
    });
  } else {
    console.log('✅ No duplicates found\n');
  }

  // Miscategorized
  if (miscategorized.length > 0) {
    console.log(`🟡 Found ${miscategorized.length} potentially miscategorized platforms:\n`);
    miscategorized.slice(0, 10).forEach(s => {
      console.log(`  ${s.platform}:`);
      console.log(`    Current: ${s.current}`);
      console.log(`    Suggested: ${s.suggested} (confidence: ${s.confidence})`);
      console.log();
    });
    if (miscategorized.length > 10) {
      console.log(`  ... and ${miscategorized.length - 10} more\n`);
    }
  } else {
    console.log('✅ All platforms properly categorized\n');
  }

  // Data Quality
  console.log('📊 Data Quality Issues:\n');
  Object.entries(dataIssues).forEach(([issue, items]) => {
    if (items.length > 0) {
      console.log(`  ${issue}: ${items.length}`);
      if (CONFIG.verbose && items.length <= 5) {
        items.forEach(item => {
          const name = typeof item === 'string' ? item : item.name;
          console.log(`    - ${name}`);
        });
      }
    }
  });
  console.log();

  // Enrichment
  if (enriched.length > 0) {
    console.log(`🌐 Enriched ${enriched.length} platforms with better descriptions\n`);
    if (CONFIG.verbose) {
      enriched.slice(0, 5).forEach(e => {
        console.log(`  ${e.name}:`);
        console.log(`    Old: ${e.old_desc?.slice(0, 60)}...`);
        console.log(`    New: ${e.new_desc.slice(0, 60)}...`);
        console.log();
      });
    }
  }

  // Save if auto-fix enabled
  if (CONFIG.auto_fix) {
    console.log('💾 Saving updated platforms.json...\n');
    writeFileSync(
      CONFIG.platforms_path,
      JSON.stringify(platforms, null, 2),
      'utf-8'
    );
    console.log('✅ Saved!\n');
  }

  // Export detailed report
  const report = {
    timestamp: new Date().toISOString(),
    total_platforms: platforms.length,
    duplicates,
    miscategorized,
    data_issues: dataIssues,
    enriched
  };

  const reportPath = join(__dirname, '../organization-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Detailed report saved to: organization-report.json\n`);

  // Summary
  console.log('='.repeat(50));
  console.log('\n📈 SUMMARY:\n');
  console.log(`  Total Platforms: ${platforms.length}`);
  console.log(`  Duplicates: ${duplicates.length} groups`);
  console.log(`  Miscategorized: ${miscategorized.length}`);
  console.log(`  Missing Data: ${Object.values(dataIssues).reduce((sum, arr) => sum + arr.length, 0)}`);
  if (CONFIG.scrape_web) {
    console.log(`  Enriched: ${enriched.length}`);
  }
  console.log();

  if (!CONFIG.auto_fix) {
    console.log('💡 Run with --fix flag to automatically fix issues');
    console.log('💡 Run with --scrape to enrich data from web');
    console.log('💡 Run with --verbose for detailed output\n');
  }
}

main().catch(console.error);
