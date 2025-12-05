#!/usr/bin/env node

/**
 * Alternatives Pages Generation Script
 * Generates "Best [Tool] Alternatives" pages
 * Uses template-based approach with platform data
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
  const category = platform.category || 'AI tools';

  return {
    slug: `${platform.slug || platform.id}-alternatives`,
    platformSlug: platform.slug || platform.id,
    title: `Best ${toolName} Alternatives in 2025: Top ${category.replace(/-/g, ' ')} Tools Compared`,
    metaDescription: `Looking for ${toolName} alternatives? Compare the top ${alternatives.length} ${category.replace(/-/g, ' ')} tools with features, pricing & use cases in 2025.`,
    introduction: `${toolName} is ${platform.description || `a popular ${category} platform`}, but it might not be the perfect fit for everyone. Whether you're looking for different features, better pricing, or specialized capabilities, there are excellent alternatives available. This guide compares the top ${alternatives.length} ${toolName} alternatives to help you find the best ${category.replace(/-/g, ' ')} tool for your needs.`,
    mainPlatform: {
      name: toolName,
      description: platform.description,
      pricing: platform.pricing,
      pros: [
        platform.verified ? 'Verified and trusted platform' : null,
        platform.featured ? 'Featured tool with proven track record' : null,
        platform.rating ? `High user rating (${platform.rating}/5)` : null,
        platform.features?.length > 5 ? 'Extensive feature set' : null
      ].filter(Boolean),
      cons: [
        platform.pricing?.includes('paid') ? 'Premium pricing may be barrier for some' : null,
        'May have more features than needed for simple use cases',
        'Learning curve for advanced features'
      ].filter(Boolean)
    },
    alternatives: alternatives.map((alt, index) => ({
      name: alt.name,
      slug: alt.slug || alt.id,
      description: alt.description || `${alt.name} is a powerful ${category} alternative`,
      pricing: alt.pricing || 'See website for pricing',
      rating: alt.rating,
      bestFor: alt.tags?.[0] || 'General use',
      keyFeatures: alt.features?.slice(0, 3) || [`${category} capabilities`, 'User-friendly interface', 'Scalable solution'],
      highlight: index === 0 ? 'Top-rated alternative' : index === 1 ? 'Best value' : index === 2 ? 'Most popular' : null
    })),
    comparisonCriteria: [
      'Pricing & Plans',
      'Features & Capabilities',
      'Ease of Use',
      'Integration Options',
      'Support & Documentation',
      'Scalability',
      'Community & Ecosystem'
    ],
    verdict: `While ${toolName} is a solid choice for ${category.replace(/-/g, ' ')}, the best alternative depends on your specific needs. ${alternatives[0]?.name || 'The top alternative'} offers ${alternatives[0]?.tags?.[0] || 'similar capabilities'}, ${alternatives[1]?.name || 'another option'} excels at ${alternatives[1]?.tags?.[0] || 'different features'}, and ${alternatives[2]?.name || 'a third choice'} provides ${alternatives[2]?.tags?.[0] || 'unique benefits'}. Consider your budget, required features, and team size when making your decision.`
  };
}

async function generateAlternativesPages(limit = 100) {
  console.log('🚀 Generating alternatives pages...\n');

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'alternatives-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Group platforms by category
  const byCategory = new Map();
  platforms.forEach(p => {
    const cat = p.category || 'uncategorized';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat).push(p);
  });

  const alternativesPages = [];

  // Generate alternatives pages for top platforms
  for (const [category, catPlatforms] of byCategory.entries()) {
    if (catPlatforms.length < 4) continue; // Need at least 4 platforms (1 main + 3 alternatives)

    const topPlatforms = catPlatforms
      .filter(p => p.slug || p.id)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 20); // Top 20 in each category

    for (let i = 0; i < Math.min(10, topPlatforms.length); i++) {
      const mainPlatform = topPlatforms[i];
      const alternatives = topPlatforms
        .filter(p => p.id !== mainPlatform.id)
        .slice(0, 9); // Up to 9 alternatives

      if (alternatives.length >= 3) {
        alternativesPages.push({ mainPlatform, alternatives });

        if (alternativesPages.length >= limit) break;
      }
    }

    if (alternativesPages.length >= limit) break;
  }

  console.log(`📊 Generating ${Math.min(limit, alternativesPages.length)} alternatives pages...\n`);

  let successCount = 0;

  for (const { mainPlatform, alternatives } of alternativesPages.slice(0, limit)) {
    try {
      const content = generateAlternativesContent(mainPlatform, alternatives);
      const outputPath = path.join(outputDir, `${content.slug}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      console.log(`✅ ${successCount + 1}. ${content.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error generating alternatives for ${mainPlatform.name}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated ${successCount} alternatives pages`);
  console.log(`📁 Output directory: alternatives-content/`);
  console.log('='.repeat(60));
}

// CLI
const args = process.argv.slice(2);
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 100;

generateAlternativesPages(limit).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
