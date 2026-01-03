#!/usr/bin/env node

/**
 * "Best Of" Pages Generation Script
 * Generates "Best [Category] Tools 2026" pages
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

function generateBestOfContent(title, platforms, description, category) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    slug,
    title: `${title} - Top Picks for 2026`,
    metaDescription: `Discover the ${platforms.length} best ${description} in 2026. Compare features, pricing & reviews to find the perfect tool for your needs.`,
    introduction: `Looking for the best ${description} in 2026? We've analyzed hundreds of tools to bring you this curated list of the top ${platforms.length} options. Whether you're a developer, business, or individual user, this guide helps you choose the right ${description.replace(/tools?/i, 'tool')}.`,
    category: category || 'AI tools',
    totalPlatforms: platforms.length,
    platforms: platforms.map((platform, index) => ({
      rank: index + 1,
      name: platform.name,
      slug: platform.slug || platform.id,
      description: platform.description || `${platform.name} is a powerful ${category} solution`,
      pricing: platform.pricing || 'See website for pricing',
      rating: platform.rating,
      verified: platform.verified,
      featured: platform.featured,
      bestFor: platform.tags?.[0] || 'General use',
      keyFeatures: platform.features?.slice(0, 3) || ['Core features', 'User-friendly', 'Scalable'],
      pros: [
        platform.verified ? 'Verified platform' : null,
        platform.rating >= 4.5 ? 'Highly rated' : null,
        platform.features?.length > 5 ? 'Feature-rich' : null
      ].filter(Boolean),
      cons: [
        platform.pricing?.includes('paid') && !platform.pricing?.includes('free') ? 'Paid only' : null,
        'May have learning curve'
      ].filter(Boolean)
    })),
    selectionCriteria: [
      'User ratings and reviews',
      'Feature completeness',
      'Pricing and value for money',
      'Ease of use and onboarding',
      'Documentation and support',
      'Community and ecosystem',
      'Integration capabilities',
      'Performance and reliability'
    ],
    howToChoose: [
      `Define your specific needs and use cases for ${description}`,
      'Consider your budget and team size',
      'Evaluate required integrations with existing tools',
      'Check free trials or free tiers before committing',
      'Read user reviews and case studies',
      'Assess scalability for future growth',
      'Consider support and documentation quality'
    ],
    verdict: `All ${platforms.length} ${description} on this list are excellent choices, each with unique strengths. ${platforms[0]?.name} leads with ${platforms[0]?.tags?.[0] || 'comprehensive features'}, while ${platforms[1]?.name} offers ${platforms[1]?.tags?.[0] || 'great value'}. Your best choice depends on your specific requirements, budget, and technical expertise.`
  };
}

async function generateBestOfPages(limit = 300) {
  console.log('🚀 Generating "Best Of" pages...\n');

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'bestof-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pages = [];

  // 1. Best [Category] Tools 2026
  const byCategory = new Map();
  platforms.forEach(p => {
    const cat = p.category || 'uncategorized';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat).push(p);
  });

  for (const [category, catPlatforms] of byCategory.entries()) {
    if (catPlatforms.length < 3) continue;

    const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const topPlatforms = catPlatforms
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 15);

    pages.push({
      title: `Best ${categoryName} AI Tools`,
      platforms: topPlatforms,
      description: `${categoryName.toLowerCase()} AI tools`,
      category
    });
  }

  // 2. Best Free [Category] Tools
  for (const [category, catPlatforms] of byCategory.entries()) {
    const freePlatforms = catPlatforms
      .filter(p => p.pricing?.toLowerCase().includes('free'))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    if (freePlatforms.length >= 3) {
      const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      pages.push({
        title: `Best Free ${categoryName} AI Tools`,
        platforms: freePlatforms,
        description: `free ${categoryName.toLowerCase()} AI tools`,
        category
      });
    }
  }

  // 3. Best Open Source [Category] Tools
  for (const [category, catPlatforms] of byCategory.entries()) {
    const openSourcePlatforms = catPlatforms
      .filter(p => p.tags?.some(t => t.toLowerCase().includes('open source') || t.toLowerCase().includes('open-source')))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    if (openSourcePlatforms.length >= 3) {
      const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      pages.push({
        title: `Best Open Source ${categoryName} AI Tools`,
        platforms: openSourcePlatforms,
        description: `open source ${categoryName.toLowerCase()} AI tools`,
        category
      });
    }
  }

  // 4. Best Enterprise [Category] Tools
  for (const [category, catPlatforms] of byCategory.entries()) {
    const enterprisePlatforms = catPlatforms
      .filter(p => p.tags?.some(t => t.toLowerCase().includes('enterprise')) || p.pricing?.toLowerCase().includes('enterprise'))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    if (enterprisePlatforms.length >= 3) {
      const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      pages.push({
        title: `Best Enterprise ${categoryName} AI Tools`,
        platforms: enterprisePlatforms,
        description: `enterprise ${categoryName.toLowerCase()} AI tools`,
        category
      });
    }
  }

  // 5. Best Tools by Popular Tags
  const tagCounts = new Map();
  platforms.forEach(p => {
    p.tags?.forEach(tag => {
      if (!tagCounts.has(tag)) {
        tagCounts.set(tag, []);
      }
      tagCounts.get(tag).push(p);
    });
  });

  const popularTags = Array.from(tagCounts.entries())
    .filter(([tag, platforms]) => platforms.length >= 5)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 50);

  for (const [tag, tagPlatforms] of popularTags) {
    const topPlatforms = tagPlatforms
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);

    pages.push({
      title: `Best ${tag} AI Tools`,
      platforms: topPlatforms,
      description: `${tag.toLowerCase()} AI tools`,
      category: tagPlatforms[0]?.category || 'ai-tools'
    });
  }

  // 6. Best Tools for Specific Use Cases
  const useCases = [
    { name: 'Developers', filter: p => p.tags?.some(t => ['Development', 'Code', 'Programming', 'IDE', 'GitHub'].some(kw => t.includes(kw))) },
    { name: 'Data Scientists', filter: p => p.tags?.some(t => ['Data', 'Analytics', 'ML', 'Model', 'Training'].some(kw => t.includes(kw))) },
    { name: 'Content Creators', filter: p => p.tags?.some(t => ['Content', 'Creative', 'Design', 'Video', 'Image'].some(kw => t.includes(kw))) },
    { name: 'Businesses', filter: p => p.tags?.some(t => ['Enterprise', 'Business', 'Automation', 'Workflow'].some(kw => t.includes(kw))) },
    { name: 'Researchers', filter: p => p.tags?.some(t => ['Research', 'Academic', 'Scientific'].some(kw => t.includes(kw))) },
  ];

  for (const useCase of useCases) {
    const useCasePlatforms = platforms
      .filter(useCase.filter)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);

    if (useCasePlatforms.length >= 5) {
      pages.push({
        title: `Best AI Tools for ${useCase.name}`,
        platforms: useCasePlatforms,
        description: `AI tools for ${useCase.name.toLowerCase()}`,
        category: 'ai-tools'
      });
    }
  }

  console.log(`📊 Generating ${Math.min(limit, pages.length)} "best of" pages...\n`);

  let successCount = 0;

  for (const page of pages.slice(0, limit)) {
    try {
      const content = generateBestOfContent(page.title, page.platforms, page.description, page.category);
      const outputPath = path.join(outputDir, `${content.slug}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      console.log(`✅ ${successCount + 1}. ${content.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error generating: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated ${successCount} "best of" pages`);
  console.log(`📁 Output directory: bestof-content/`);
  console.log('='.repeat(60));
}

// CLI
const args = process.argv.slice(2);
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 300;

generateBestOfPages(limit).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
