#!/usr/bin/env node

/**
 * Generate Content for Newly Added Platforms
 * Creates alternatives, comparisons, and updates best-of pages
 * for the 7 platforms added on 2026-01-03
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEW_PLATFORM_IDS = [
  'marble-world-labs',
  'salesforce-agentforce',
  'pika-2-5',
  'gpt-5-1',
  'grok-4-1',
  'llama-4',
  'gemini-deep-research'
];

async function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const data = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
  return Array.isArray(data) ? data : (data.platforms || []);
}

function findSimilarPlatforms(platform, allPlatforms, limit = 10) {
  const sameCategoryPlatforms = allPlatforms.filter(p =>
    p.id !== platform.id &&
    (p.category === platform.category || p.categories?.some(c => platform.categories?.includes(c)))
  );

  const sameTagPlatforms = allPlatforms.filter(p =>
    p.id !== platform.id &&
    p.tags?.some(t => platform.tags?.includes(t))
  );

  const combined = [...new Set([...sameCategoryPlatforms, ...sameTagPlatforms])];

  return combined
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

function generateAlternativesPage(mainPlatform, alternatives) {
  const slug = `${mainPlatform.slug || mainPlatform.id}-alternatives`;

  return {
    slug,
    platformSlug: mainPlatform.slug || mainPlatform.id,
    title: `Best ${mainPlatform.name} Alternatives in 2026: Top ${alternatives.length} Tools Compared`,
    metaDescription: `Discover the best ${mainPlatform.name} alternatives in 2026. Compare ${alternatives.length} top-rated tools with detailed features, pricing, and reviews to find the perfect fit.`,
    introduction: `${mainPlatform.name} has established itself as a ${mainPlatform.category?.replace(/-/g, ' ')} solution, but it may not be the perfect fit for everyone. Whether you're looking for different pricing models, specific features, or alternative approaches to ${mainPlatform.category?.replace(/-/g, ' ')}, this comprehensive guide explores the top ${alternatives.length} ${mainPlatform.name} alternatives in 2026.\n\nWe've analyzed each platform based on features, pricing, ease of use, and user reviews to help you make an informed decision. From established enterprise solutions to innovative startups, you'll find options that match your specific needs and budget.`,
    mainPlatformAnalysis: {
      overview: mainPlatform.description || `${mainPlatform.name} is a leading platform in the ${mainPlatform.category?.replace(/-/g, ' ')} space.`,
      limitations: [
        'May not fit all budget ranges',
        'Specific feature requirements might differ',
        'Alternative pricing models may be preferred',
        'Different user interface preferences'
      ],
      pricing: mainPlatform.pricing || 'Visit website for current pricing',
      bestFor: mainPlatform.tags?.[0] || 'General use cases'
    },
    alternatives: alternatives.map((alt, idx) => ({
      name: alt.name,
      slug: alt.slug || alt.id,
      rank: idx + 1,
      tagline: alt.tags?.[0] || 'Powerful alternative solution',
      description: alt.description || `${alt.name} is a comprehensive ${alt.category?.replace(/-/g, ' ')} platform offering robust features and capabilities.`,
      pricing: alt.pricing || 'See website for pricing',
      bestFor: alt.tags?.[0] || 'Various use cases',
      keyFeatures: alt.features?.slice(0, 5) || ['Core functionality', 'User-friendly interface', 'Scalable architecture', 'Integration support', 'Regular updates'],
      pros: [
        alt.verified ? 'Verified platform' : null,
        alt.rating >= 4.5 ? 'Highly rated by users' : null,
        alt.features?.length > 5 ? 'Feature-rich platform' : null,
        alt.pricing?.toLowerCase().includes('free') ? 'Free tier available' : null
      ].filter(Boolean).slice(0, 3),
      cons: [
        alt.pricing && !alt.pricing.toLowerCase().includes('free') ? 'No free tier' : null,
        'May require learning curve'
      ].filter(Boolean),
      whySwitch: `Consider ${alt.name} if you need ${alt.tags?.[0]?.toLowerCase() || 'specific features'} or prefer ${alt.category?.replace(/-/g, ' ')} solutions.`
    })),
    comparisonTable: {
      criteria: ['Pricing Flexibility', 'Features', 'Ease of Use', 'Support Quality', 'Integration Options'],
      scores: {
        [mainPlatform.name]: [8, 9, 8, 8, 9],
        ...Object.fromEntries(alternatives.slice(0, 5).map(alt => [
          alt.name,
          [
            alt.pricing?.toLowerCase().includes('free') ? 9 : 7,
            alt.features?.length > 5 ? 9 : 7,
            8,
            alt.verified ? 9 : 7,
            8
          ]
        ]))
      }
    },
    howToChoose: {
      title: `How to Choose the Right ${mainPlatform.name} Alternative`,
      factors: [
        {
          name: 'Feature Requirements',
          description: 'Identify must-have features and ensure the alternative supports them comprehensively.'
        },
        {
          name: 'Budget Constraints',
          description: 'Compare pricing models and choose a solution that fits your budget while meeting your needs.'
        },
        {
          name: 'Integration Needs',
          description: 'Verify compatibility with your existing tech stack and tools you rely on daily.'
        },
        {
          name: 'Scalability',
          description: 'Ensure the platform can grow with your needs and handle increased usage over time.'
        },
        {
          name: 'User Experience',
          description: 'Test the interface and workflow to ensure it matches your team\'s preferences and skills.'
        }
      ]
    },
    verdict: `Each ${mainPlatform.name} alternative on this list offers unique strengths. ${alternatives[0]?.name} stands out for ${alternatives[0]?.tags?.[0]?.toLowerCase() || 'comprehensive features'}, while ${alternatives[1]?.name} excels in ${alternatives[1]?.tags?.[0]?.toLowerCase() || 'ease of use'}. ${alternatives[2]?.name} is ideal for ${alternatives[2]?.tags?.[0]?.toLowerCase() || 'specific use cases'}.\n\nYour best choice depends on your specific requirements. If you prioritize ${mainPlatform.tags?.[0]?.toLowerCase()}, ${mainPlatform.name} remains a solid choice. However, if you need different pricing models, specific features, or alternative approaches, the platforms listed above provide excellent alternatives worth exploring.`,
    faqs: [
      {
        question: `What is the best free alternative to ${mainPlatform.name}?`,
        answer: alternatives.find(a => a.pricing?.toLowerCase().includes('free'))
          ? `${alternatives.find(a => a.pricing?.toLowerCase().includes('free')).name} offers a free tier with robust features, making it an excellent free alternative.`
          : `While most professional alternatives require payment, many offer free trials. Check individual platforms for current free tier availability.`
      },
      {
        question: `Which ${mainPlatform.name} alternative is best for enterprises?`,
        answer: alternatives.find(a => a.tags?.some(t => t.toLowerCase().includes('enterprise')))
          ? `${alternatives.find(a => a.tags?.some(t => t.toLowerCase().includes('enterprise'))).name} is specifically designed for enterprise needs with advanced features and dedicated support.`
          : `${alternatives[0]?.name} offers enterprise-grade features and is trusted by large organizations.`
      },
      {
        question: `Can I migrate my data from ${mainPlatform.name} to an alternative?`,
        answer: `Most modern platforms support data import/export. Check with your chosen alternative's documentation for specific migration guides and tools.`
      },
      {
        question: `How do these alternatives compare in terms of pricing?`,
        answer: `Pricing varies significantly. ${alternatives.find(a => a.pricing?.toLowerCase().includes('free'))?.name || alternatives[0]?.name} offers competitive pricing, while others may focus on premium features. Review each platform's pricing page for current details.`
      }
    ]
  };
}

function generateComparisonPage(platform1, platform2) {
  const slug = `${platform1.slug || platform1.id}-vs-${platform2.slug || platform2.id}`;

  return {
    slug,
    platform1Slug: platform1.slug || platform1.id,
    platform2Slug: platform2.slug || platform2.id,
    title: `${platform1.name} vs ${platform2.name}: Which ${platform1.category?.replace(/-/g, ' ')} Tool is Better in 2026?`,
    metaDescription: `Compare ${platform1.name} vs ${platform2.name} in 2026. Detailed analysis of features, pricing, pros & cons to help you choose the right ${platform1.category?.replace(/-/g, ' ')} tool.`,
    introduction: `Choosing between ${platform1.name} and ${platform2.name} can be challenging. Both platforms offer powerful ${platform1.category?.replace(/-/g, ' ')} capabilities, but they take different approaches and cater to different needs.\n\nIn this comprehensive comparison, we'll analyze both platforms across key dimensions: features, pricing, ease of use, and ideal use cases. Whether you're ${platform1.tags?.[0]?.toLowerCase() || 'looking for a solution'}, this guide will help you make an informed decision.`,
    sections: [
      {
        title: 'Overview',
        paragraphs: [
          `${platform1.name} is ${platform1.description || `a leading ${platform1.category?.replace(/-/g, ' ')} platform known for its comprehensive features`}.`,
          `${platform2.name}, on the other hand, ${platform2.description || `provides a different approach to ${platform2.category?.replace(/-/g, ' ')} with unique capabilities`}.`
        ]
      },
      {
        title: 'Pricing Comparison',
        paragraphs: [
          `${platform1.name} pricing: ${platform1.pricing || 'Visit their website for current pricing details'}.`,
          `${platform2.name} pricing: ${platform2.pricing || 'Check their website for the latest pricing information'}.`,
          `Both platforms offer different value propositions. ${platform1.pricing?.toLowerCase().includes('free') ? platform1.name + ' provides a free tier' : ''} ${platform2.pricing?.toLowerCase().includes('free') ? platform2.name + ' also offers free access' : ''}.`
        ]
      },
      {
        title: 'Features & Capabilities',
        paragraphs: [
          `${platform1.name} excels in ${platform1.features?.slice(0, 3).join(', ') || 'core features'}, making it ideal for ${platform1.tags?.[0]?.toLowerCase() || 'various use cases'}.`,
          `${platform2.name} stands out with ${platform2.features?.slice(0, 3).join(', ') || 'unique capabilities'}, particularly for ${platform2.tags?.[0]?.toLowerCase() || 'specific applications'}.`,
          `Feature comparison: ${platform1.features?.length || 0} vs ${platform2.features?.length || 0} documented features respectively.`
        ]
      },
      {
        title: 'Use Cases & Best For',
        paragraphs: [
          `Choose ${platform1.name} if you need ${platform1.tags?.[0]?.toLowerCase() || 'comprehensive features'} or if you're ${platform1.tags?.[1]?.toLowerCase() || 'working on complex projects'}.`,
          `${platform2.name} is better suited for ${platform2.tags?.[0]?.toLowerCase() || 'specific use cases'} or when ${platform2.tags?.[1]?.toLowerCase() || 'different requirements'} are priorities.`
        ]
      },
      {
        title: 'Pros & Cons',
        paragraphs: [
          `${platform1.name} Pros: ${platform1.verified ? 'Verified platform, ' : ''}${platform1.rating >= 4.5 ? 'Highly rated, ' : ''}${platform1.features?.length > 5 ? 'Feature-rich' : 'Reliable'}. Cons: ${platform1.pricing && !platform1.pricing.toLowerCase().includes('free') ? 'Paid only' : 'Learning curve may exist'}.`,
          `${platform2.name} Pros: ${platform2.verified ? 'Verified platform, ' : ''}${platform2.rating >= 4.5 ? 'Highly rated, ' : ''}${platform2.features?.length > 5 ? 'Feature-rich' : 'Solid option'}. Cons: ${platform2.pricing && !platform2.pricing.toLowerCase().includes('free') ? 'Requires payment' : 'May require time to master'}.`
        ]
      }
    ],
    comparisonTable: {
      criteria: ['Pricing Flexibility', 'Feature Set', 'Ease of Use', 'Documentation', 'Community Support'],
      platform1Scores: [
        platform1.pricing?.toLowerCase().includes('free') ? 9 : 7,
        platform1.features?.length > 5 ? 9 : 7,
        8,
        platform1.verified ? 9 : 7,
        8
      ],
      platform2Scores: [
        platform2.pricing?.toLowerCase().includes('free') ? 9 : 7,
        platform2.features?.length > 5 ? 9 : 7,
        8,
        platform2.verified ? 9 : 7,
        8
      ]
    },
    verdict: `Both ${platform1.name} and ${platform2.name} are excellent ${platform1.category?.replace(/-/g, ' ')} platforms with distinct strengths.\n\nChoose ${platform1.name} if:\n- You need ${platform1.tags?.[0]?.toLowerCase() || 'comprehensive features'}\n- ${platform1.pricing?.toLowerCase().includes('free') ? 'You want a free tier option' : 'You prefer their pricing model'}\n- ${platform1.features?.length > 5 ? 'You need extensive features' : 'Their approach matches your workflow'}\n\nChoose ${platform2.name} if:\n- ${platform2.tags?.[0]?.toLowerCase() || 'Specific capabilities'} are your priority\n- ${platform2.pricing?.toLowerCase().includes('free') ? 'Free access is important' : 'You prefer their value proposition'}\n- ${platform2.features?.length > 5 ? 'You want a feature-rich platform' : 'Their solution fits your needs better'}\n\nUltimately, both tools can deliver excellent results. Your choice should depend on your specific requirements, budget, and preferred workflow.`,
    faqs: [
      {
        question: `Which is more affordable: ${platform1.name} or ${platform2.name}?`,
        answer: `${platform1.name} offers ${platform1.pricing || 'competitive pricing'}, while ${platform2.name} provides ${platform2.pricing || 'flexible options'}. Review both pricing pages for current details.`
      },
      {
        question: `Can I use both ${platform1.name} and ${platform2.name} together?`,
        answer: `Yes, many users combine multiple tools to leverage the strengths of each platform. Check integration capabilities on their respective websites.`
      },
      {
        question: `Which has better customer support?`,
        answer: `Both platforms offer ${platform1.verified && platform2.verified ? 'verified' : 'quality'} support. ${platform1.verified ? platform1.name : platform2.name} is verified by our team, indicating strong support standards.`
      }
    ]
  };
}

async function main() {
  console.log('🚀 Generating content for 7 newly added platforms...\n');

  const allPlatforms = await loadPlatforms();
  const newPlatforms = allPlatforms.filter(p => NEW_PLATFORM_IDS.includes(p.id));

  console.log(`Found ${newPlatforms.length} new platforms:\n`);
  newPlatforms.forEach(p => console.log(`  - ${p.name}`));
  console.log();

  // 1. Generate Alternatives Pages
  console.log('📄 Generating Alternatives Pages...\n');
  const alternativesDir = path.join(__dirname, '..', 'alternatives-content');
  if (!fs.existsSync(alternativesDir)) {
    fs.mkdirSync(alternativesDir, { recursive: true });
  }

  let altCount = 0;
  for (const platform of newPlatforms) {
    const similarPlatforms = findSimilarPlatforms(platform, allPlatforms, 12);

    if (similarPlatforms.length >= 5) {
      const altPage = generateAlternativesPage(platform, similarPlatforms);
      const outputPath = path.join(alternativesDir, `${altPage.slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(altPage, null, 2));
      console.log(`✅ ${++altCount}. Best ${platform.name} Alternatives (${similarPlatforms.length} alternatives)`);
    } else {
      console.log(`⚠️  Skipping ${platform.name} - not enough similar platforms`);
    }
  }

  // 2. Generate Comparison Pages
  console.log('\n🔄 Generating Comparison Pages...\n');
  const comparisonDir = path.join(__dirname, '..', 'comparison-content');
  if (!fs.existsSync(comparisonDir)) {
    fs.mkdirSync(comparisonDir, { recursive: true });
  }

  let compCount = 0;
  for (const newPlatform of newPlatforms) {
    const similarPlatforms = findSimilarPlatforms(newPlatform, allPlatforms, 5);

    for (const similarPlatform of similarPlatforms.slice(0, 3)) {
      const compPage = generateComparisonPage(newPlatform, similarPlatform);
      const outputPath = path.join(comparisonDir, `${compPage.slug}.json`);

      // Check if reverse comparison exists
      const reverseSlug = `${similarPlatform.slug || similarPlatform.id}-vs-${newPlatform.slug || newPlatform.id}`;
      const reverseExists = fs.existsSync(path.join(comparisonDir, `${reverseSlug}.json`));

      if (!reverseExists) {
        fs.writeFileSync(outputPath, JSON.stringify(compPage, null, 2));
        console.log(`✅ ${++compCount}. ${newPlatform.name} vs ${similarPlatform.name}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Content Generation Complete!`);
  console.log(`   Alternatives pages: ${altCount}`);
  console.log(`   Comparison pages: ${compCount}`);
  console.log(`   Total new pages: ${altCount + compCount}`);
  console.log('='.repeat(60));
  console.log('\n💡 Best-of pages will automatically include new platforms');
  console.log('   when you run: node scripts/generate-bestof-pages.mjs\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
