#!/usr/bin/env node

/**
 * Comparison Pages Generation Script
 * Generates "[Tool A] vs [Tool B]" comparison pages
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

function generateComparisonContent(platform1, platform2) {
  const p1Name = platform1.name;
  const p2Name = platform2.name;
  const category = platform1.category === platform2.category ? platform1.category : 'AI tools';

  return {
    slug: `${platform1.slug || platform1.id}-vs-${platform2.slug || platform2.id}`,
    platform1Slug: platform1.slug || platform1.id,
    platform2Slug: platform2.slug || platform2.id,
    title: `${p1Name} vs ${p2Name}: Which ${category.replace(/-/g, ' ')} Tool is Better in 2026?`,
    metaDescription: `Compare ${p1Name} vs ${p2Name}. See pricing, features, pros & cons to choose the best ${category.replace(/-/g, ' ')} tool for your needs in 2026.`,
    introduction: `Choosing between ${p1Name} and ${p2Name} for your ${category.replace(/-/g, ' ')} needs? Both are popular tools in the AI space, but they have different strengths, pricing models, and use cases. This comprehensive comparison breaks down the key differences to help you make an informed decision.`,
    sections: [
      {
        title: `Overview: ${p1Name} vs ${p2Name}`,
        paragraphs: [
          `${p1Name} is ${platform1.description || `a leading ${category} platform`}. It's known for ${platform1.tags?.slice(0, 3).join(', ') || 'its powerful features'}.`,
          `${p2Name}, on the other hand, is ${platform2.description || `another strong option in the ${category} space`}. Users choose it for ${platform2.tags?.slice(0, 3).join(', ') || 'its unique capabilities'}.`
        ]
      },
      {
        title: 'Pricing Comparison',
        paragraphs: [
          `${p1Name} pricing: ${platform1.pricing || 'See official website for current pricing'}.`,
          `${p2Name} pricing: ${platform2.pricing || 'See official website for current pricing'}.`,
          `When it comes to value for money, consider your specific use case and team size. ${platform1.pricing?.includes('free') ? `${p1Name} offers a free tier, making it great for getting started.` : ''} ${platform2.pricing?.includes('free') ? `${p2Name} also has a free option for small teams or individuals.` : ''}`
        ]
      },
      {
        title: 'Features & Capabilities',
        paragraphs: [
          `${p1Name} excels in: ${platform1.features?.slice(0, 3).join(', ') || 'core platform features'}. This makes it ideal for teams that need ${platform1.tags?.[0] || 'powerful capabilities'}.`,
          `${p2Name} stands out with: ${platform2.features?.slice(0, 3).join(', ') || 'its feature set'}. It's particularly strong for users focused on ${platform2.tags?.[0] || 'specific use cases'}.`
        ]
      },
      {
        title: 'Use Cases: When to Choose Each Tool',
        paragraphs: [
          `Choose ${p1Name} if: You need ${platform1.tags?.[0] || 'the primary feature'}, work with ${platform1.tags?.[1] || 'specific technologies'}, or require ${platform1.pricing?.includes('enterprise') ? 'enterprise-grade support' : 'flexible pricing'}.`,
          `Choose ${p2Name} if: You prioritize ${platform2.tags?.[0] || 'the key capability'}, work in ${platform2.tags?.[1] || 'certain environments'}, or prefer ${platform2.pricing?.includes('free') ? 'a free tier to start' : 'their pricing model'}.`
        ]
      },
      {
        title: 'Pros & Cons',
        paragraphs: [
          `${p1Name} Pros: ${platform1.verified ? 'Verified platform, ' : ''}${platform1.featured ? 'Featured tool, ' : ''}${platform1.rating ? `Highly rated (${platform1.rating}/5), ` : ''}${platform1.features?.length > 5 ? 'Extensive feature set' : 'Focused capabilities'}.`,
          `${p1Name} Cons: ${platform1.pricing?.includes('paid') ? 'Paid plans may be needed for full features' : 'Some limitations on free tier'}.`,
          `${p2Name} Pros: ${platform2.verified ? 'Verified platform, ' : ''}${platform2.featured ? 'Featured tool, ' : ''}${platform2.rating ? `Highly rated (${platform2.rating}/5), ` : ''}${platform2.features?.length > 5 ? 'Comprehensive features' : 'Streamlined approach'}.`,
          `${p2Name} Cons: ${platform2.pricing?.includes('paid') ? 'Premium features require paid plans' : 'May have feature limitations'}.`
        ]
      }
    ],
    verdict: `Both ${p1Name} and ${p2Name} are solid choices for ${category.replace(/-/g, ' ')}. Your choice depends on your specific requirements: ${p1Name} is better for ${platform1.tags?.[0] || 'certain use cases'}, while ${p2Name} excels at ${platform2.tags?.[0] || 'other scenarios'}. Consider trying both with their free tiers or trials to see which fits your workflow better.`
  };
}

async function generateComparisonPages(limit = 100) {
  console.log('🚀 Generating comparison pages...\n');

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'comparison-content');

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

  const comparisons = [];

  // Generate comparisons within each category
  for (const [category, catPlatforms] of byCategory.entries()) {
    if (catPlatforms.length < 2) continue;

    // Compare top platforms in each category
    const topPlatforms = catPlatforms
      .filter(p => p.slug || p.id)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    for (let i = 0; i < topPlatforms.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, topPlatforms.length); j++) {
        comparisons.push([topPlatforms[i], topPlatforms[j]]);

        if (comparisons.length >= limit) break;
      }
      if (comparisons.length >= limit) break;
    }

    if (comparisons.length >= limit) break;
  }

  console.log(`📊 Generating ${Math.min(limit, comparisons.length)} comparison pages...\n`);

  let successCount = 0;

  for (const [p1, p2] of comparisons.slice(0, limit)) {
    try {
      const content = generateComparisonContent(p1, p2);
      const outputPath = path.join(outputDir, `${content.slug}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      console.log(`✅ ${successCount + 1}. ${content.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error generating comparison: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated ${successCount} comparison pages`);
  console.log(`📁 Output directory: comparison-content/`);
  console.log('='.repeat(60));
}

// CLI
const args = process.argv.slice(2);
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 100;

generateComparisonPages(limit).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
