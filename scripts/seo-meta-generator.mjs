#!/usr/bin/env node
/**
 * SEO Meta Generator
 *
 * Generates optimized SEO metadata for platform pages:
 * - Meta descriptions
 * - Open Graph tags
 * - Twitter Cards
 * - Schema.org structured data
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  seo_data_path: join(__dirname, '../seo-metadata.json'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  max_platforms: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 100,
  verbose: process.argv.includes('--verbose'),
  dry_run: process.argv.includes('--dry-run'),
};

let platforms = [];

try {
  platforms = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8'));
  console.log(`📊 Loaded ${platforms.length} platforms\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

if (!CONFIG.deepseek_api_key) {
  console.error('❌ DEEPSEEK_API_KEY not set!');
  process.exit(1);
}

async function callDeepSeek(prompt) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.deepseek_api_key}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || response.statusText);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('API error:', error.message);
    return null;
  }
}

// Generate SEO metadata for platform
async function generateSEO(platform) {
  const prompt = `Generate SEO metadata for this AI platform:

PLATFORM: ${platform.name}
DESCRIPTION: ${platform.description || 'N/A'}
CATEGORY: ${platform.category || 'N/A'}
FEATURES: ${platform.features?.join(', ') || 'N/A'}
PRICING: ${platform.pricing || 'N/A'}

Generate optimized SEO data. Return ONLY valid JSON:

{
  "meta_title": "60 chars max, include platform name + category + year",
  "meta_description": "155 chars max, compelling, include key features & CTA",
  "og_title": "Social media optimized title, 60 chars max",
  "og_description": "Social media description, 200 chars max",
  "twitter_title": "Twitter optimized title",
  "twitter_description": "Twitter description",
  "keywords": ["8-10 relevant SEO keywords"],
  "schema_type": "SoftwareApplication",
  "schema_description": "Detailed description for structured data",
  "schema_category": "AI category",
  "focus_keyword": "Primary SEO keyword",
  "secondary_keywords": ["3-5 secondary keywords"]
}

RULES:
- Be specific and compelling
- Include year (2026) where relevant
- Use action words
- Include pricing if available (e.g., "Free", "From $X")
- Make descriptions click-worthy`;

  const response = await callDeepSeek(prompt);
  if (!response) return null;

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    if (CONFIG.verbose) {
      console.error(`  Failed to parse for ${platform.name}`);
    }
  }

  return null;
}

// Main
async function main() {
  console.log('🎯 SEO META GENERATOR\n');

  // Prioritize platforms without SEO data
  const needsSEO = platforms
    .filter(p => p.name && !p.seo_metadata)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    })
    .slice(0, CONFIG.max_platforms);

  console.log(`Generating SEO for ${needsSEO.length} platforms...\n`);

  const seoData = [];

  for (let i = 0; i < needsSEO.length; i++) {
    const platform = needsSEO[i];

    console.log(`[${i + 1}/${needsSEO.length}] ${platform.name}`);

    const seo = await generateSEO(platform);

    if (seo) {
      platform.seo_metadata = {
        ...seo,
        generated_at: new Date().toISOString()
      };

      seoData.push({
        platform_id: platform.id,
        platform_name: platform.name,
        ...seo
      });

      console.log(`  ✅ Generated SEO metadata`);
      if (CONFIG.verbose) {
        console.log(`     Title: ${seo.meta_title}`);
        console.log(`     Description: ${seo.meta_description}`);
      }
    } else {
      console.log(`  ❌ Failed`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\n📊 SEO GENERATION SUMMARY\n`);
  console.log(`Platforms processed: ${needsSEO.length}`);
  console.log(`Successfully generated: ${seoData.length}`);
  console.log(`Success rate: ${((seoData.length / needsSEO.length) * 100).toFixed(1)}%`);

  if (!CONFIG.dry_run) {
    writeFileSync(CONFIG.platforms_path, JSON.stringify(platforms, null, 2));
    console.log(`\n✅ Updated platforms.json with SEO metadata`);

    writeFileSync(CONFIG.seo_data_path, JSON.stringify(seoData, null, 2));
    console.log(`✅ Saved SEO data to ${CONFIG.seo_data_path}`);
  }

  console.log('\n🎉 SEO generation complete!');
}

main().catch(console.error);
