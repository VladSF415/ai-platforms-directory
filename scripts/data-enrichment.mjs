#!/usr/bin/env node
/**
 * Data Enrichment Pipeline
 *
 * Fills missing data for platforms:
 * - Pricing details, features, use cases, target audience, API availability
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  max_platforms: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 50,
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
        temperature: 0.3,
        max_tokens: 1500
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

// Calculate completeness score
function calculateCompleteness(platform) {
  let score = 0;
  let maxScore = 0;

  const checks = [
    { field: 'description', weight: 3 },
    { field: 'pricing', weight: 2 },
    { field: 'features', weight: 2, isArray: true, minLength: 3 },
    { field: 'use_cases', weight: 2, isArray: true, minLength: 3 },
    { field: 'tags', weight: 1, isArray: true, minLength: 5 },
    { field: 'target_audience', weight: 2, isArray: true, minLength: 2 },
    { field: 'pricing_details', weight: 2 },
    { field: 'has_api', weight: 1 },
  ];

  checks.forEach(check => {
    maxScore += check.weight;

    if (check.isArray) {
      if (platform[check.field] && platform[check.field].length >= (check.minLength || 1)) {
        score += check.weight;
      }
    } else {
      if (platform[check.field]) {
        score += check.weight;
      }
    }
  });

  return (score / maxScore) * 100;
}

// Enrich platform
async function enrichPlatform(platform) {
  const existingCategories = [...new Set(platforms.map(p => p.category).filter(Boolean))];

  const prompt = `Enrich this AI platform with comprehensive, accurate data:

PLATFORM: ${platform.name}
URL: ${platform.url || platform.website || 'N/A'}
CURRENT DESCRIPTION: ${platform.description || 'Missing'}
CURRENT CATEGORY: ${platform.category || 'Missing'}
CURRENT FEATURES: ${platform.features?.join(', ') || 'Missing'}
CURRENT TAGS: ${platform.tags?.join(', ') || 'Missing'}

TASK: Research and provide COMPLETE, ACCURATE data. Return ONLY valid JSON:

{
  "description": "Rich 2-3 sentences: what it does, key capabilities, target users, unique value",
  "category": "Best fit from [${existingCategories.join(', ')}] or new category",
  "tags": ["8-10 specific, searchable tags"],
  "features": ["6-8 concrete features with specifics"],
  "use_cases": ["5-6 real-world use cases"],
  "target_audience": ["3-4 primary user types"],
  "pricing": "free/freemium/paid/open-source/enterprise",
  "pricing_details": {
    "model": "subscription/one-time/usage-based/free",
    "free_tier": "Yes/No - what's included",
    "starting_price": "$XX/month or Free",
    "tiers": ["Free: details", "Pro: $XX/mo", "Enterprise: Custom"]
  },
  "has_api": true/false,
  "api_details": "REST API, rate limits, pricing" or null,
  "integration_platforms": ["Zapier", "Make", "n8n"] or [],
  "languages_supported": ["English", "Spanish"] or [],
  "compliance": ["GDPR", "SOC2", "HIPAA"] or [],
  "confidence": 0.0-1.0
}

CRITICAL:
- Only include VERIFIED information
- If unsure, use null or [] and lower confidence
- Be specific with pricing (exact amounts)
- Focus on facts, not marketing`;

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
  console.log('🔧 DATA ENRICHMENT PIPELINE\n');

  // Find platforms needing enrichment
  const platformsWithScore = platforms.map(p => ({
    platform: p,
    completeness: calculateCompleteness(p)
  }));

  // Sort by completeness (lowest first) and featured status
  const needsEnrichment = platformsWithScore
    .filter(p => p.completeness < 80)
    .sort((a, b) => {
      // Prioritize featured platforms
      if (a.platform.featured && !b.platform.featured) return -1;
      if (!a.platform.featured && b.platform.featured) return 1;

      // Then by completeness (lowest first)
      return a.completeness - b.completeness;
    })
    .slice(0, CONFIG.max_platforms);

  console.log(`📊 Found ${needsEnrichment.length} platforms needing enrichment\n`);

  const enriched = [];

  for (let i = 0; i < needsEnrichment.length; i++) {
    const { platform, completeness } = needsEnrichment[i];

    console.log(`[${i + 1}/${needsEnrichment.length}] ${platform.name} (${completeness.toFixed(0)}% complete)`);

    const enrichmentData = await enrichPlatform(platform);

    if (enrichmentData && enrichmentData.confidence > 0.6) {
      // Merge enrichment data
      Object.assign(platform, {
        description: enrichmentData.description || platform.description,
        category: enrichmentData.category || platform.category,
        tags: enrichmentData.tags?.length ? enrichmentData.tags : platform.tags,
        features: enrichmentData.features?.length ? enrichmentData.features : platform.features,
        use_cases: enrichmentData.use_cases?.length ? enrichmentData.use_cases : platform.use_cases,
        target_audience: enrichmentData.target_audience || platform.target_audience,
        pricing: enrichmentData.pricing || platform.pricing,
        pricing_details: enrichmentData.pricing_details || platform.pricing_details,
        has_api: enrichmentData.has_api !== undefined ? enrichmentData.has_api : platform.has_api,
        api_details: enrichmentData.api_details || platform.api_details,
        integration_platforms: enrichmentData.integration_platforms || platform.integration_platforms,
        languages_supported: enrichmentData.languages_supported || platform.languages_supported,
        compliance: enrichmentData.compliance || platform.compliance,
        enriched_at: new Date().toISOString(),
        enrichment_confidence: enrichmentData.confidence
      });

      const newCompleteness = calculateCompleteness(platform);
      console.log(`  ✅ Enriched: ${completeness.toFixed(0)}% → ${newCompleteness.toFixed(0)}% (confidence: ${(enrichmentData.confidence * 100).toFixed(0)}%)`);
      enriched.push(platform.name);
    } else {
      console.log(`  ⚠️  Low confidence or failed`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\n📊 ENRICHMENT SUMMARY\n`);
  console.log(`Platforms processed: ${needsEnrichment.length}`);
  console.log(`Successfully enriched: ${enriched.length}`);
  console.log(`Success rate: ${((enriched.length / needsEnrichment.length) * 100).toFixed(1)}%`);

  // Calculate average completeness improvement
  const avgBefore = needsEnrichment.reduce((sum, p) => sum + p.completeness, 0) / needsEnrichment.length;
  const avgAfter = needsEnrichment.reduce((sum, p) => sum + calculateCompleteness(p.platform), 0) / needsEnrichment.length;

  console.log(`\nAverage completeness:`);
  console.log(`  Before: ${avgBefore.toFixed(1)}%`);
  console.log(`  After: ${avgAfter.toFixed(1)}%`);
  console.log(`  Improvement: +${(avgAfter - avgBefore).toFixed(1)}%`);

  if (!CONFIG.dry_run) {
    writeFileSync(CONFIG.platforms_path, JSON.stringify(platforms, null, 2));
    console.log(`\n✅ Saved enriched data to platforms.json`);
  }

  console.log('\n🎉 Data enrichment complete!');
}

main().catch(console.error);
