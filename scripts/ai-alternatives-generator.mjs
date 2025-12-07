#!/usr/bin/env node

/**
 * AI-Powered Alternatives Generator
 * Uses DeepSeek to generate rich "Best X Alternatives" pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY environment variable not set');
  process.exit(1);
}

async function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const data = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
  return Array.isArray(data) ? data : (data.platforms || []);
}

async function callDeepSeek(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
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
              content: 'You are an expert AI tools reviewer creating detailed alternatives pages for SEO. Always return valid JSON.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 6000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 402 || response.status === 429 || errorText.includes('quota')) {
          console.error('💰 Credits exhausted!');
          process.exit(2);
        }
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`  Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function generateAIAlternatives(mainPlatform, alternatives) {
  const altList = alternatives.slice(0, 10).map(a => `
- ${a.name}: ${a.description || 'N/A'}
  Pricing: ${a.pricing || 'N/A'}
  Tags: ${(a.tags || []).join(', ')}`).join('\n');

  const prompt = `Generate a comprehensive "Best ${mainPlatform.name} Alternatives" page.

MAIN PLATFORM: ${mainPlatform.name}
- Category: ${mainPlatform.category}
- Description: ${mainPlatform.description}
- Pricing: ${mainPlatform.pricing}
- Tags: ${(mainPlatform.tags || []).join(', ')}

ALTERNATIVES TO COVER:
${altList}

Generate JSON with this EXACT structure:
{
  "slug": "${mainPlatform.slug || mainPlatform.id}-alternatives",
  "platformSlug": "${mainPlatform.slug || mainPlatform.id}",
  "title": "Best ${mainPlatform.name} Alternatives in 2025: Top [N] Tools Compared",
  "metaDescription": "150-160 char SEO description mentioning ${mainPlatform.name} alternatives",
  "introduction": "3-4 paragraph intro (300-400 words) explaining why users seek alternatives",
  "mainPlatformAnalysis": {
    "overview": "What ${mainPlatform.name} offers",
    "limitations": ["limitation 1", "limitation 2", "limitation 3"],
    "pricing": "Detailed pricing breakdown",
    "bestFor": "Who should use ${mainPlatform.name}"
  },
  "alternatives": [
    {
      "name": "Alternative Name",
      "slug": "alternative-slug",
      "rank": 1,
      "tagline": "Short catchy tagline",
      "description": "150-200 word detailed description",
      "pricing": "Pricing details",
      "bestFor": "Primary use case",
      "keyFeatures": ["feature1", "feature2", "feature3"],
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2"],
      "whySwitch": "Why choose this over ${mainPlatform.name}"
    }
  ],
  "comparisonTable": {
    "criteria": ["Pricing", "Features", "Ease of Use", "Support", "Integration"],
    "scores": {
      "${mainPlatform.name}": [7, 8, 8, 7, 8]
    }
  },
  "howToChoose": {
    "title": "How to Choose the Right ${mainPlatform.name} Alternative",
    "factors": [
      {"name": "Factor 1", "description": "Why it matters"},
      {"name": "Factor 2", "description": "Why it matters"}
    ]
  },
  "verdict": "300+ word conclusion with specific recommendations for different user types",
  "faqs": [
    {"question": "Is X better than ${mainPlatform.name}?", "answer": "Detailed answer"},
    {"question": "What is the cheapest alternative?", "answer": "Detailed answer"},
    {"question": "What is the best free alternative?", "answer": "Detailed answer"}
  ]
}

For each alternative, include the slug from the data provided. Generate at least 8 alternatives.
RETURN ONLY THE JSON, NO ADDITIONAL TEXT.`;

  const response = await callDeepSeek(prompt);

  // Robustly extract JSON from the response, handling markdown code blocks
  let jsonContent = response;
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonContent);
    
    // Ensure alternatives have correct slugs
    parsed.alternatives = parsed.alternatives.map((alt, i) => ({
      ...alt,
      slug: alternatives[i]?.slug || alternatives[i]?.id || alt.slug
    }));

    return parsed;
  } catch (error) {
    console.error(`❌ Failed to parse JSON for ${mainPlatform.name} alternatives.`);
    console.error(`   Error: ${error.message}`);
    // Return a null or empty object to signify failure without crashing
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1]) || 10;

  console.log(`🚀 AI Alternatives Generator - Creating ${count} rich pages\n`);

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'alternatives-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get existing alternatives
  const existing = new Set(fs.readdirSync(outputDir).map(f => f.replace('.json', '')));

  // Group by category
  const byCategory = new Map();
  platforms.forEach(p => {
    const cat = p.category || 'uncategorized';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(p);
  });

  // Find platforms that need alternatives pages
  const candidates = [];

  for (const [category, catPlatforms] of byCategory.entries()) {
    if (catPlatforms.length < 5) continue;

    const sorted = catPlatforms
      .filter(p => p.slug || p.id)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    for (const platform of sorted.slice(0, 15)) {
      const slug = `${platform.slug || platform.id}-alternatives`;
      if (!existing.has(slug)) {
        const alts = sorted.filter(p => p.id !== platform.id).slice(0, 12);
        if (alts.length >= 5) {
          candidates.push({ mainPlatform: platform, alternatives: alts });
        }
      }
    }
  }

  console.log(`📊 Found ${candidates.length} platforms needing alternatives pages\n`);

  let successCount = 0;

  for (const { mainPlatform, alternatives } of candidates.slice(0, count)) {
    try {
      console.log(`🤖 Generating: Best ${mainPlatform.name} Alternatives...`);

      const content = await generateAIAlternatives(mainPlatform, alternatives);
      
      if (!content || !content.slug) {
        console.log(`   ⚠️  Skipping due to content generation failure.`);
        continue; // Skip to the next iteration
      }

      const outputPath = path.join(outputDir, `${content.slug}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      console.log(`✅ ${++successCount}. ${content.title}`);

      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      if (error.message.includes('quota') || error.message.includes('402')) {
        console.log('💰 Credits exhausted, stopping...');
        break;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated ${successCount} AI-powered alternatives pages`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
