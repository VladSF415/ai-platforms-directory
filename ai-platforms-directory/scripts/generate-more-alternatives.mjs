#!/usr/bin/env node

/**
 * Generate More Alternatives Pages
 * Creates alternatives pages for additional high-profile platforms
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

function generateAlternativesContent(platform, alternatives) {
  const toolName = platform.name;

  return {
    slug: `${platform.slug || platform.id}-alternatives`,
    platformSlug: platform.slug || platform.id,
    title: `Best ${toolName} Alternatives in 2026: Top AI Tools Compared`,
    metaDescription: `Looking for ${toolName} alternatives? Compare the top ${alternatives.length} AI tools with features, pricing & use cases.`,
    introduction: `${toolName} is ${platform.description || 'a popular AI platform'}, but there are excellent alternatives. This guide compares ${alternatives.length} top options.`,
    mainPlatform: {
      name: toolName,
      description: platform.description,
      pricing: platform.pricing
    },
    alternatives: alternatives.map((alt, index) => ({
      name: alt.name,
      slug: alt.slug || alt.id,
      description: alt.description || `${alt.name} is a powerful alternative`,
      pricing: alt.pricing || 'See website',
      rating: alt.rating,
      bestFor: alt.tags?.[0] || 'General use',
      keyFeatures: alt.features?.slice(0, 3) || ['Core features']
    })),
    verdict: `The best alternative depends on your needs. Compare these ${alternatives.length} options to find your perfect match.`
  };
}

async function generateMoreAlternatives(target = 50) {
  console.log('🚀 Generating more alternatives pages...\n');

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'alternatives-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const existing = new Set(fs.readdirSync(outputDir).map(f => f.replace('.json', '')));
  console.log(`📊 Found ${existing.size} existing alternatives pages\n`);

  // Get all platforms with slug/id
  const allPlatforms = platforms.filter(p => (p.slug || p.id) && p.name);

  // Get top platforms that don't have alternatives pages yet
  const topPlatforms = allPlatforms
    .filter(p => !existing.has(`${p.slug || p.id}-alternatives`))
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * 10 + (a.featured ? 5 : 0) + (a.verified ? 3 : 0);
      const scoreB = (b.rating || 0) * 10 + (b.featured ? 5 : 0) + (b.verified ? 3 : 0);
      return scoreB - scoreA;
    })
    .slice(0, target);

  console.log(`📊 Generating ${topPlatforms.length} new alternatives pages...\n`);

  let successCount = 0;

  for (const mainPlatform of topPlatforms) {
    try {
      // Find alternatives (similar platforms or same category)
      const alternatives = allPlatforms
        .filter(p => p.id !== mainPlatform.id)
        .filter(p => {
          // Same category or overlapping tags
          return p.category === mainPlatform.category ||
            p.tags?.some(t => mainPlatform.tags?.includes(t));
        })
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);

      // If not enough category matches, add top-rated from any category
      if (alternatives.length < 5) {
        const extra = allPlatforms
          .filter(p => p.id !== mainPlatform.id && !alternatives.find(a => a.id === p.id))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 8 - alternatives.length);

        alternatives.push(...extra);
      }

      if (alternatives.length >= 3) {
        const content = generateAlternativesContent(mainPlatform, alternatives);
        const outputPath = path.join(outputDir, `${content.slug}.json`);

        fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

        console.log(`✅ ${successCount + 1}. ${content.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated ${successCount} new alternatives pages`);
  console.log(`📊 Total alternatives: ${existing.size + successCount}`);
  console.log('='.repeat(60));
}

const args = process.argv.slice(2);
const target = parseInt(args.find(arg => arg.startsWith('--target='))?.split('=')[1]) || 50;

generateMoreAlternatives(target).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
