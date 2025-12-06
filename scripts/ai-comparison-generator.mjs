#!/usr/bin/env node

/**
 * AI-Powered Comparison Generator
 * Uses DeepSeek to generate rich, detailed comparison pages
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
              content: 'You are an expert AI tools reviewer creating detailed comparison content for SEO. Always return valid JSON.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 402 || response.status === 429 || errorText.includes('quota')) {
          console.error('💰 Credits exhausted!');
          process.exit(2); // Special exit code for credits exhausted
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

async function generateAIComparison(p1, p2) {
  const prompt = `Generate a comprehensive comparison page for "${p1.name}" vs "${p2.name}".

PLATFORM 1: ${p1.name}
- Category: ${p1.category}
- Description: ${p1.description}
- Pricing: ${p1.pricing}
- Tags: ${(p1.tags || []).join(', ')}
- Features: ${(p1.features || []).join(', ')}

PLATFORM 2: ${p2.name}
- Category: ${p2.category}
- Description: ${p2.description}
- Pricing: ${p2.pricing}
- Tags: ${(p2.tags || []).join(', ')}
- Features: ${(p2.features || []).join(', ')}

Generate JSON with this EXACT structure:
{
  "slug": "${p1.slug || p1.id}-vs-${p2.slug || p2.id}",
  "platform1Slug": "${p1.slug || p1.id}",
  "platform2Slug": "${p2.slug || p2.id}",
  "title": "SEO-optimized comparison title (include 2025)",
  "metaDescription": "150-160 char SEO meta description",
  "introduction": "2-3 paragraph compelling intro (200-300 words)",
  "sections": [
    {
      "title": "Overview",
      "paragraphs": ["paragraph1", "paragraph2"]
    },
    {
      "title": "Pricing Comparison",
      "paragraphs": ["detailed pricing analysis"]
    },
    {
      "title": "Features & Capabilities",
      "paragraphs": ["feature comparison"]
    },
    {
      "title": "Use Cases",
      "paragraphs": ["when to use each"]
    },
    {
      "title": "Pros & Cons",
      "paragraphs": ["${p1.name} pros/cons", "${p2.name} pros/cons"]
    }
  ],
  "comparisonTable": {
    "criteria": ["Pricing", "Ease of Use", "Features", "Support", "API Access"],
    "platform1Scores": [8, 9, 8, 7, 9],
    "platform2Scores": [7, 8, 9, 8, 8]
  },
  "verdict": "300+ word final verdict with clear recommendation",
  "faqs": [
    {"question": "FAQ 1?", "answer": "Detailed answer"},
    {"question": "FAQ 2?", "answer": "Detailed answer"}
  ]
}

RETURN ONLY THE JSON, NO ADDITIONAL TEXT.`;

  const response = await callDeepSeek(prompt);

  // Extract JSON
  let jsonContent = response;
  if (response.includes('```json')) {
    jsonContent = response.match(/```json\n([\s\S]*?)\n```/)?.[1] || response;
  } else if (response.includes('```')) {
    jsonContent = response.match(/```\n([\s\S]*?)\n```/)?.[1] || response;
  }

  return JSON.parse(jsonContent);
}

async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1]) || 10;

  console.log(`🚀 AI Comparison Generator - Creating ${count} rich comparisons\n`);

  const platforms = await loadPlatforms();
  const outputDir = path.join(__dirname, '..', 'comparison-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get existing comparisons
  const existing = new Set(fs.readdirSync(outputDir).map(f => f.replace('.json', '')));

  // Get top platforms
  const topPlatforms = platforms
    .filter(p => p.slug || p.id)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 50);

  // Find pairs without existing comparisons
  const pairs = [];
  for (let i = 0; i < topPlatforms.length && pairs.length < count; i++) {
    for (let j = i + 1; j < topPlatforms.length && pairs.length < count; j++) {
      const p1 = topPlatforms[i];
      const p2 = topPlatforms[j];
      const slug = `${p1.slug || p1.id}-vs-${p2.slug || p2.id}`;
      const reverseSlug = `${p2.slug || p2.id}-vs-${p1.slug || p1.id}`;

      if (!existing.has(slug) && !existing.has(reverseSlug)) {
        pairs.push([p1, p2]);
      }
    }
  }

  console.log(`📊 Found ${pairs.length} new comparison pairs\n`);

  let successCount = 0;

  for (const [p1, p2] of pairs) {
    try {
      console.log(`🤖 Generating: ${p1.name} vs ${p2.name}...`);

      const content = await generateAIComparison(p1, p2);
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
  console.log(`✅ Generated ${successCount} AI-powered comparison pages`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
