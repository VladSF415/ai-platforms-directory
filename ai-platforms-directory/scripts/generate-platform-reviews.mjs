#!/usr/bin/env node

/**
 * Platform Review Generator
 *
 * Generates rich, SEO-optimized blog posts/reviews for each AI platform.
 * Uses DeepSeek AI for content generation.
 *
 * Usage:
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/generate-platform-reviews.mjs --count=10
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/generate-platform-reviews.mjs --platform="ChatGPT"
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/generate-platform-reviews.mjs --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ ERROR: DEEPSEEK_API_KEY environment variable not set');
  process.exit(1);
}

// Load platforms
function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  return JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
}

// Get platforms that need reviews
function getPlatformsNeedingReviews(platforms, existingReviews) {
  return platforms.filter(p => {
    const slug = slugify(p.name);
    return !existingReviews.includes(slug);
  });
}

// Slugify platform name
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Call DeepSeek API
async function callDeepSeek(prompt, maxTokens = 4000) {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI technology writer and SEO specialist. You write comprehensive, engaging, and SEO-optimized reviews of AI platforms. Your content is:
- Detailed and informative (2000+ words)
- Well-structured with clear headings
- SEO-optimized with natural keyword usage
- Honest and balanced (mentioning both pros and cons)
- Actionable with specific use cases
- Written in a professional but accessible tone
- Includes specific examples and comparisons`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    return null;
  }
}

// Generate review for a platform
async function generatePlatformReview(platform, allPlatforms) {
  const categoryPlatforms = allPlatforms
    .filter(p => p.category === platform.category && p.name !== platform.name)
    .slice(0, 5)
    .map(p => p.name);

  const prompt = `Write a comprehensive, SEO-optimized review article for the AI platform "${platform.name}".

PLATFORM INFORMATION:
- Name: ${platform.name}
- Category: ${platform.category || 'AI Tool'}
- Description: ${platform.description || 'AI platform'}
- Website: ${platform.url || platform.website || 'N/A'}
- Pricing: ${platform.pricing || 'Various pricing tiers available'}
- Tags: ${(platform.tags || []).join(', ') || 'AI, automation'}

COMPETITORS IN SAME CATEGORY: ${categoryPlatforms.join(', ') || 'Various alternatives'}

Create a detailed review article with the following structure:

1. **Title** - SEO-optimized title (include the platform name and "Review 2026")

2. **Meta Description** - 150-160 character SEO description

3. **Introduction** (200+ words)
   - Hook the reader with a compelling opening
   - Briefly introduce what the platform does
   - Mention who it's best for
   - Include the primary keyword naturally

4. **What is [Platform Name]?** (300+ words)
   - Detailed explanation of the platform
   - History and background
   - Company behind it
   - Core technology/approach

5. **Key Features** (400+ words)
   - List and explain 6-8 major features
   - Include specific capabilities
   - Highlight unique selling points

6. **Pricing & Plans** (200+ words)
   - Detail all pricing tiers
   - Free tier/trial if available
   - Value analysis
   - Best plan for different user types

7. **Pros and Cons** (300+ words)
   - 5-6 genuine pros with explanations
   - 3-4 honest cons with context
   - Be balanced and fair

8. **Use Cases** (300+ words)
   - 4-5 specific use cases
   - Who benefits most
   - Real-world applications
   - Industry-specific applications

9. **How to Get Started** (200+ words)
   - Step-by-step getting started guide
   - Tips for beginners
   - Best practices

10. **Comparison with Alternatives** (300+ words)
    - Brief comparison with 2-3 competitors
    - When to choose this platform vs others
    - Unique advantages

11. **Expert Verdict** (200+ words)
    - Overall assessment
    - Rating out of 10
    - Who should use it
    - Final recommendation

12. **FAQ Section** (6-8 questions)
    - Common questions about the platform
    - Concise, helpful answers
    - Include long-tail keywords naturally

Return the content as a valid JSON object with this structure:
{
  "title": "SEO title here",
  "slug": "platform-name-slug",
  "metaDescription": "SEO meta description",
  "metaKeywords": ["keyword1", "keyword2", ...],
  "lastUpdated": "2026-01-01",
  "platform": {
    "name": "${platform.name}",
    "category": "${platform.category || 'ai-tools'}",
    "url": "${platform.url || platform.website || ''}",
    "pricing": "${platform.pricing || 'Various'}"
  },
  "rating": 8.5,
  "introduction": "Full introduction text here...",
  "whatIs": "What is section content...",
  "features": [
    {"title": "Feature 1", "description": "Description..."},
    ...
  ],
  "pricing": {
    "overview": "Pricing overview text",
    "plans": [
      {"name": "Free", "price": "$0", "features": ["feature1", "feature2"]},
      ...
    ],
    "recommendation": "Best value recommendation"
  },
  "pros": ["Pro 1 with explanation", "Pro 2...", ...],
  "cons": ["Con 1 with context", "Con 2...", ...],
  "useCases": [
    {"title": "Use Case 1", "description": "Description..."},
    ...
  ],
  "gettingStarted": "Step by step guide text...",
  "comparison": {
    "overview": "Comparison overview",
    "competitors": [
      {"name": "Competitor 1", "comparison": "How it compares..."},
      ...
    ]
  },
  "verdict": {
    "summary": "Overall verdict text",
    "rating": 8.5,
    "bestFor": "Who should use it",
    "recommendation": "Final recommendation"
  },
  "faq": [
    {"question": "Question 1?", "answer": "Answer 1..."},
    ...
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, just the JSON object.`;

  const response = await callDeepSeek(prompt, 6000);
  if (!response) return null;

  try {
    // Try to parse JSON
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const review = JSON.parse(jsonStr);

    // Ensure required fields
    review.slug = review.slug || slugify(platform.name);
    review.generatedAt = new Date().toISOString();
    review.platform = review.platform || {
      name: platform.name,
      category: platform.category,
      url: platform.url || platform.website
    };

    return review;
  } catch (error) {
    console.error(`  ❌ Failed to parse review JSON: ${error.message}`);
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

// Save review
function saveReview(review) {
  const outputDir = path.join(__dirname, '..', 'platform-reviews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${review.slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(review, null, 2));

  console.log(`  💾 Saved: ${review.slug}.json`);
  return outputPath;
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Platform Review Generator

Usage:
  node scripts/generate-platform-reviews.mjs --count=10     Generate reviews for 10 platforms
  node scripts/generate-platform-reviews.mjs --platform="X" Generate review for specific platform
  node scripts/generate-platform-reviews.mjs --all          Generate reviews for all platforms

Options:
  --count=N        Number of reviews to generate (default: 5)
  --platform=NAME  Generate review for specific platform
  --all            Generate reviews for all platforms without reviews
  --help           Show this help message
`);
    return;
  }

  console.log('🚀 Platform Review Generator\n');

  const platforms = loadPlatforms();
  console.log(`📊 Loaded ${platforms.length} platforms\n`);

  // Check existing reviews
  const reviewsDir = path.join(__dirname, '..', 'platform-reviews');
  let existingReviews = [];
  if (fs.existsSync(reviewsDir)) {
    existingReviews = fs.readdirSync(reviewsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }
  console.log(`📝 Found ${existingReviews.length} existing reviews\n`);

  let platformsToReview = [];

  // Check for specific platform
  const platformArg = args.find(a => a.startsWith('--platform='));
  if (platformArg) {
    const platformName = platformArg.split('=')[1].replace(/"/g, '');
    const platform = platforms.find(p =>
      p.name.toLowerCase() === platformName.toLowerCase()
    );
    if (platform) {
      platformsToReview = [platform];
    } else {
      console.error(`❌ Platform not found: ${platformName}`);
      return;
    }
  } else {
    // Get platforms needing reviews
    platformsToReview = getPlatformsNeedingReviews(platforms, existingReviews);

    // Check count
    const countArg = args.find(a => a.startsWith('--count='));
    const count = countArg ? parseInt(countArg.split('=')[1]) : 5;

    if (!args.includes('--all')) {
      // Prioritize popular platforms (those with more complete data)
      platformsToReview = platformsToReview
        .sort((a, b) => {
          const scoreA = (a.description?.length || 0) + (a.tags?.length || 0) * 10;
          const scoreB = (b.description?.length || 0) + (b.tags?.length || 0) * 10;
          return scoreB - scoreA;
        })
        .slice(0, count);
    }
  }

  if (platformsToReview.length === 0) {
    console.log('✅ All platforms have reviews!');
    return;
  }

  console.log(`📝 Generating reviews for ${platformsToReview.length} platforms...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const platform of platformsToReview) {
    console.log(`🤖 Generating review for: ${platform.name}...`);

    const review = await generatePlatformReview(platform, platforms);

    if (review) {
      saveReview(review);
      successCount++;
      console.log(`  ✅ ${review.title}\n`);
    } else {
      errorCount++;
      console.log(`  ❌ Failed to generate review\n`);
    }

    // Rate limiting
    if (platformsToReview.indexOf(platform) < platformsToReview.length - 1) {
      console.log('  ⏳ Waiting 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated ${successCount} reviews`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📁 Output: platform-reviews/`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
