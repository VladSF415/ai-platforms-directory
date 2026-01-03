#!/usr/bin/env node

/**
 * Add Verified Healthcare AI Platforms and Generate E-E-A-T Content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env') });

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeek(prompt, temperature = 0.7) {
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
          content: 'You are a Healthcare AI expert creating E-E-A-T compliant content for medical professionals.'
        },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    return null;
  }
}

async function enrichPlatformData(platform) {
  console.log(`\n🔍 Enriching: ${platform.name}...`);

  const prompt = `Create comprehensive E-E-A-T compliant data for this REAL Healthcare AI platform:

Platform: ${platform.name}
URL: ${platform.url}
Known For: ${platform.knownFor}
Founded: ${platform.founded || 'Unknown'}

Return detailed JSON:
{
  "description": "E-E-A-T compliant 3-4 sentence description with clinical applications, measurable impact, FDA/regulatory status if known, and authoritative details",
  "pricing": "Pricing model (Enterprise, Contact for pricing, etc.)",
  "category": "healthcare-ai",
  "categories": ["healthcare-ai", "specific-subcategory"],
  "tags": ["Relevant", "Medical", "Tags", "Based on specialty"],
  "features": [
    "Specific clinical feature 1",
    "Specific clinical feature 2",
    "Specific clinical feature 3",
    "Specific clinical feature 4",
    "Specific clinical feature 5"
  ],
  "rating": 4.5,
  "verified": true,
  "clinicalValidation": "FDA approval, clinical trials, or validation status",
  "compliance": ["HIPAA", "SOC 2", "Other standards"],
  "targetAudience": "Specific medical professionals or healthcare settings"
}

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.5);
  return extractJSON(response);
}

async function generateAlternatives(platform, allPlatforms) {
  const healthcarePlatforms = allPlatforms
    .filter(p => p.id !== platform.id && p.category === 'healthcare-ai')
    .slice(0, 12);

  if (healthcarePlatforms.length < 5) return null;

  const prompt = `Generate "Best ${platform.name} Alternatives" page.

Main Platform: ${platform.name}
Description: ${platform.description}

Alternatives: ${healthcarePlatforms.map(p => p.name).join(', ')}

Return JSON:
{
  "slug": "${platform.id}-alternatives",
  "platformSlug": "${platform.id}",
  "title": "Best ${platform.name} Alternatives in 2026",
  "metaDescription": "SEO meta 150-160 chars",
  "introduction": "E-E-A-T intro 300+ words",
  "alternatives": [
    {
      "name": "Alternative name",
      "slug": "slug",
      "rank": 1,
      "description": "Clinical description",
      "bestFor": "Use case"
    }
  ]
}

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.7);
  return extractJSON(response);
}

async function main() {
  console.log('🏥 Adding Verified Healthcare AI Platforms\n');
  console.log('='.repeat(60));

  // Load verified platforms
  const verifiedPath = path.join(__dirname, '..', 'verified-healthcare-platforms.json');
  const verifiedData = JSON.parse(fs.readFileSync(verifiedPath, 'utf-8'));
  const verifiedPlatforms = verifiedData.verified;

  console.log(`✅ Found ${verifiedPlatforms.length} verified platforms\n`);

  // Load existing platforms
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const allPlatforms = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));

  const timestamp = new Date().toISOString();
  const newPlatforms = [];

  // Enrich each platform
  for (const platform of verifiedPlatforms) {
    const enrichedData = await enrichPlatformData(platform);

    if (!enrichedData) {
      console.log(`  ❌ Failed to enrich ${platform.name}`);
      continue;
    }

    const fullPlatform = {
      id: platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      slug: platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: platform.name,
      url: platform.url,
      description: enrichedData.description,
      pricing: enrichedData.pricing,
      category: 'healthcare-ai',
      categories: enrichedData.categories || ['healthcare-ai'],
      tags: enrichedData.tags || ['Healthcare', 'Medical AI'],
      features: enrichedData.features || [],
      rating: enrichedData.rating || 4.5,
      verified: true,
      clinicalValidation: enrichedData.clinicalValidation,
      compliance: enrichedData.compliance,
      targetAudience: enrichedData.targetAudience,
      created_at: timestamp,
      added_date: timestamp
    };

    newPlatforms.push(fullPlatform);
    console.log(`  ✅ ${platform.name} enriched`);

    await new Promise(r => setTimeout(r, 2000));
  }

  // Add to database
  allPlatforms.push(...newPlatforms);
  fs.writeFileSync(platformsPath, JSON.stringify(allPlatforms, null, 2));

  console.log(`\n✅ Added ${newPlatforms.length} platforms to database`);
  console.log(`📊 Total platforms: ${allPlatforms.length}`);

  // Generate alternatives (limited to save time/cost)
  console.log('\n📄 Generating Alternatives Pages (top 10)...\n');
  const alternativesDir = path.join(__dirname, '..', 'alternatives-content');
  let altCount = 0;

  for (const platform of newPlatforms.slice(0, 10)) {
    const altPage = await generateAlternatives(platform, allPlatforms);
    if (altPage) {
      fs.writeFileSync(
        path.join(alternativesDir, `${altPage.slug}.json`),
        JSON.stringify(altPage, null, 2)
      );
      console.log(`  ✅ ${platform.name} alternatives`);
      altCount++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Complete!');
  console.log(`   Platforms added: ${newPlatforms.length}`);
  console.log(`   Alternatives pages: ${altCount}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
