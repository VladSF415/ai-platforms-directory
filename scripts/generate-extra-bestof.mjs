#!/usr/bin/env node

/**
 * Extra "Best Of" Pages - Specialized Lists
 * Generates niche and specialized "best of" pages
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
    title: `${title} - Top Picks for 2025`,
    metaDescription: `Discover the ${platforms.length} best ${description} in 2025. Compare features, pricing & reviews.`,
    introduction: `Looking for the best ${description} in 2025? This curated list features ${platforms.length} top options to help you choose the right tool.`,
    category: category || 'AI tools',
    totalPlatforms: platforms.length,
    platforms: platforms.map((platform, index) => ({
      rank: index + 1,
      name: platform.name,
      slug: platform.slug || platform.id,
      description: platform.description || `${platform.name} is a powerful solution`,
      pricing: platform.pricing || 'See website',
      rating: platform.rating,
      verified: platform.verified,
      bestFor: platform.tags?.[0] || 'General use',
      keyFeatures: platform.features?.slice(0, 3) || ['Core features']
    })),
    verdict: `Each tool has unique strengths. Choose based on your specific needs and budget.`
  };
}

async function generateExtraBestOf(target = 50) {
  console.log('🚀 Generating extra "best of" pages...\n');

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'bestof-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const existing = new Set(fs.readdirSync(outputDir).map(f => f.replace('.json', '')));
  console.log(`📊 Found ${existing.size} existing "best of" pages\n`);

  const specialLists = [];

  // 1. By pricing tiers
  const freeTier = platforms.filter(p => p.pricing?.toLowerCase().includes('free'));
  if (freeTier.length >= 5) {
    specialLists.push({ title: 'Best Free AI Tools', platforms: freeTier.slice(0, 15), description: 'free AI tools', category: 'ai-tools' });
  }

  const paidTools = platforms.filter(p => p.pricing && !p.pricing.toLowerCase().includes('free'));
  if (paidTools.length >= 5) {
    specialLists.push({ title: 'Best Paid AI Tools', platforms: paidTools.slice(0, 15), description: 'paid AI tools', category: 'ai-tools' });
  }

  // 2. By rating
  const highRated = platforms.filter(p => p.rating >= 4.5).sort((a, b) => b.rating - a.rating);
  if (highRated.length >= 5) {
    specialLists.push({ title: 'Highest Rated AI Tools', platforms: highRated.slice(0, 15), description: 'highest rated AI tools', category: 'ai-tools' });
  }

  // 3. By verification status
  const verified = platforms.filter(p => p.verified);
  if (verified.length >= 5) {
    specialLists.push({ title: 'Best Verified AI Platforms', platforms: verified.slice(0, 15), description: 'verified AI platforms', category: 'ai-tools' });
  }

  // 4. By feature count (comprehensive tools)
  const featureRich = platforms.filter(p => p.features?.length > 5).sort((a, b) => b.features.length - a.features.length);
  if (featureRich.length >= 5) {
    specialLists.push({ title: 'Most Feature-Rich AI Tools', platforms: featureRich.slice(0, 12), description: 'feature-rich AI tools', category: 'ai-tools' });
  }

  // 5. Trending/Popular tools
  const popular = platforms.filter(p => p.featured || p.trending).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (popular.length >= 5) {
    specialLists.push({ title: 'Most Popular AI Tools', platforms: popular.slice(0, 15), description: 'popular AI tools', category: 'ai-tools' });
  }

  // 6. Industry-specific
  const industries = [
    { name: 'Healthcare', keywords: ['health', 'medical', 'clinical', 'diagnosis', 'patient'] },
    { name: 'Finance', keywords: ['finance', 'trading', 'banking', 'investment', 'financial'] },
    { name: 'Marketing', keywords: ['marketing', 'advertising', 'content', 'social media', 'SEO'] },
    { name: 'Education', keywords: ['education', 'learning', 'teaching', 'academic', 'student'] },
    { name: 'Manufacturing', keywords: ['manufacturing', 'industrial', 'production', 'quality control', 'automation'] },
  ];

  for (const industry of industries) {
    const industryTools = platforms.filter(p =>
      industry.keywords.some(kw =>
        p.name?.toLowerCase().includes(kw) ||
        p.description?.toLowerCase().includes(kw) ||
        p.tags?.some(t => t.toLowerCase().includes(kw))
      )
    ).slice(0, 10);

    if (industryTools.length >= 3) {
      specialLists.push({
        title: `Best AI Tools for ${industry.name}`,
        platforms: industryTools,
        description: `AI tools for ${industry.name.toLowerCase()}`,
        category: 'ai-tools'
      });
    }
  }

  // 7. By deployment type
  const cloudTools = platforms.filter(p => p.tags?.some(t => t.toLowerCase().includes('cloud'))).slice(0, 12);
  if (cloudTools.length >= 5) {
    specialLists.push({ title: 'Best Cloud AI Tools', platforms: cloudTools, description: 'cloud-based AI tools', category: 'ai-tools' });
  }

  const onPrem = platforms.filter(p => p.tags?.some(t => t.toLowerCase().includes('on-premise') || t.toLowerCase().includes('self-hosted'))).slice(0, 10);
  if (onPrem.length >= 3) {
    specialLists.push({ title: 'Best Self-Hosted AI Tools', platforms: onPrem, description: 'self-hosted AI tools', category: 'ai-tools' });
  }

  // 8. By team size
  const smallTeam = platforms.filter(p => p.pricing?.toLowerCase().includes('starter') || p.pricing?.toLowerCase().includes('small')).slice(0, 10);
  if (smallTeam.length >= 5) {
    specialLists.push({ title: 'Best AI Tools for Small Teams', platforms: smallTeam, description: 'AI tools for small teams', category: 'ai-tools' });
  }

  // 9. Beginner-friendly
  const beginnerFriendly = platforms.filter(p =>
    p.tags?.some(t => t.toLowerCase().includes('beginner') || t.toLowerCase().includes('easy') || t.toLowerCase().includes('simple'))
  ).slice(0, 12);
  if (beginnerFriendly.length >= 5) {
    specialLists.push({ title: 'Best AI Tools for Beginners', platforms: beginnerFriendly, description: 'beginner-friendly AI tools', category: 'ai-tools' });
  }

  // 10. Advanced/Professional
  const advanced = platforms.filter(p =>
    p.tags?.some(t => t.toLowerCase().includes('professional') || t.toLowerCase().includes('enterprise') || t.toLowerCase().includes('advanced'))
  ).slice(0, 12);
  if (advanced.length >= 5) {
    specialLists.push({ title: 'Best Professional AI Tools', platforms: advanced, description: 'professional AI tools', category: 'ai-tools' });
  }

  // Filter out existing
  const newLists = specialLists.filter(list => !existing.has(list.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')));

  console.log(`📊 Generating ${Math.min(target, newLists.length)} new "best of" pages...\n`);

  let successCount = 0;

  for (const list of newLists.slice(0, target)) {
    try {
      const content = generateBestOfContent(list.title, list.platforms, list.description, list.category);
      const outputPath = path.join(outputDir, `${content.slug}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      console.log(`✅ ${successCount + 1}. ${content.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated ${successCount} new "best of" pages`);
  console.log(`📊 Total "best of" pages: ${existing.size + successCount}`);
  console.log('='.repeat(60));
}

const args = process.argv.slice(2);
const target = parseInt(args.find(arg => arg.startsWith('--target='))?.split('=')[1]) || 50;

generateExtraBestOf(target).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
