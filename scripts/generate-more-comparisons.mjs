#!/usr/bin/env node

/**
 * Enhanced Comparison Pages - Cross-Category & High-Profile Matchups
 * Generates additional comparison pages beyond category boundaries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const data = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
  return Array.isArray(data) ? data : (data.platforms || []);
}

function generateComparisonContent(platform1, platform2) {
  const p1Name = platform1.name;
  const p2Name = platform2.name;
  const sameCategory = platform1.category === platform2.category;
  const category = sameCategory ? platform1.category : 'AI tools';

  return {
    slug: `${platform1.slug || platform1.id}-vs-${platform2.slug || platform2.id}`,
    platform1Slug: platform1.slug || platform1.id,
    platform2Slug: platform2.slug || platform2.id,
    title: `${p1Name} vs ${p2Name}: Which ${sameCategory ? category.replace(/-/g, ' ') + ' Tool' : 'AI Tool'} is Better in 2025?`,
    metaDescription: `Compare ${p1Name} vs ${p2Name}. See pricing, features, pros & cons to choose the best AI tool for your needs in 2025.`,
    introduction: `Choosing between ${p1Name} and ${p2Name}? ${sameCategory ? `Both are popular ${category.replace(/-/g, ' ')} tools` : 'These AI tools serve different but sometimes overlapping purposes'}, each with unique strengths. This comparison breaks down the key differences to help you decide.`,
    crossCategory: !sameCategory,
    sections: [
      {
        title: `Overview: ${p1Name} vs ${p2Name}`,
        paragraphs: [
          `${p1Name} (${platform1.category?.replace(/-/g, ' ') || 'AI tool'}) is ${platform1.description || 'a powerful platform'}. It's known for ${platform1.tags?.slice(0, 3).join(', ') || 'its capabilities'}.`,
          `${p2Name} (${platform2.category?.replace(/-/g, ' ') || 'AI tool'}) is ${platform2.description || 'another strong option'}. Users choose it for ${platform2.tags?.slice(0, 3).join(', ') || 'its features'}.`
        ]
      },
      {
        title: 'Pricing Comparison',
        paragraphs: [
          `${p1Name}: ${platform1.pricing || 'Visit website for pricing details'}.`,
          `${p2Name}: ${platform2.pricing || 'Visit website for pricing details'}.`
        ]
      },
      {
        title: 'Key Features',
        paragraphs: [
          `${p1Name}: ${platform1.features?.slice(0, 3).join(', ') || 'Core features available'}`,
          `${p2Name}: ${platform2.features?.slice(0, 3).join(', ') || 'Full feature set'}`
        ]
      }
    ],
    verdict: `Both ${p1Name} and ${p2Name} are excellent AI tools. ${sameCategory ? 'For ' + category.replace(/-/g, ' ') + ', your' : 'Your'} choice depends on specific needs: ${p1Name} for ${platform1.tags?.[0] || 'certain use cases'}, ${p2Name} for ${platform2.tags?.[0] || 'other scenarios'}.`
  };
}

async function generateMoreComparisons(target = 200) {
  console.log('🚀 Generating enhanced comparison pages...\n');

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'comparison-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get existing comparisons
  const existing = new Set(fs.readdirSync(outputDir).map(f => f.replace('.json', '')));
  console.log(`📊 Found ${existing.size} existing comparisons\n`);

  // Get top platforms across all categories
  const topPlatforms = platforms
    .filter(p => (p.slug || p.id) && p.name)
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * 10 + (a.featured ? 5 : 0) + (a.verified ? 3 : 0);
      const scoreB = (b.rating || 0) * 10 + (b.featured ? 5 : 0) + (b.verified ? 3 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 100);

  const comparisons = [];
  const maxPerPlatform = 5;

  // Generate cross-category comparisons for top platforms
  for (let i = 0; i < topPlatforms.length && comparisons.length < target; i++) {
    let count = 0;
    for (let j = i + 1; j < topPlatforms.length && count < maxPerPlatform; j++) {
      const p1 = topPlatforms[i];
      const p2 = topPlatforms[j];
      const slug1 = `${p1.slug || p1.id}-vs-${p2.slug || p2.id}`;
      const slug2 = `${p2.slug || p2.id}-vs-${p1.slug || p1.id}`;

      if (!existing.has(slug1) && !existing.has(slug2)) {
        comparisons.push([p1, p2]);
        count++;

        if (comparisons.length >= target) break;
      }
    }
  }

  console.log(`📊 Generating ${comparisons.length} new comparison pages...\n`);

  let successCount = 0;

  for (const [p1, p2] of comparisons) {
    try {
      const content = generateComparisonContent(p1, p2);
      const outputPath = path.join(outputDir, `${content.slug}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      console.log(`✅ ${successCount + 1}. ${content.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated ${successCount} new comparison pages`);
  console.log(`📊 Total comparisons: ${existing.size + successCount}`);
  console.log('='.repeat(60));
}

const args = process.argv.slice(2);
const target = parseInt(args.find(arg => arg.startsWith('--target='))?.split('=')[1]) || 200;

generateMoreComparisons(target).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
