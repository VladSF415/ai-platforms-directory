#!/usr/bin/env node

/**
 * Verified Healthcare AI Platform Research
 * Finds REAL platforms and verifies URLs actually work
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

if (!DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY not set');
  process.exit(1);
}

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
          content: 'You are a Healthcare AI research expert. Only provide REAL, verifiable platforms with actual working websites. Never invent or fabricate platform names or URLs.'
        },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse JSON:', error.message);
    return null;
  }
}

async function verifyURL(url) {
  try {
    console.log(`    🔍 Verifying: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HealthcareAI-Researcher/1.0)'
      }
    });

    clearTimeout(timeout);

    const isValid = response.status >= 200 && response.status < 400;
    console.log(`    ${isValid ? '✅' : '❌'} Status: ${response.status}`);
    return isValid;

  } catch (error) {
    console.log(`    ❌ Failed: ${error.message}`);
    return false;
  }
}

async function researchRealHealthcarePlatforms() {
  console.log('🔍 Researching REAL Healthcare AI platforms with verified URLs...\n');

  const prompt = `Find 20 REAL, established Healthcare AI platforms that have actual working websites.

CRITICAL REQUIREMENTS:
1. These must be REAL companies/platforms that actually exist
2. Provide their actual, verifiable website URLs
3. Focus on well-known, established platforms in healthcare AI
4. Include major players like:
   - Medical imaging AI companies (e.g., Aidoc, Zebra Medical Vision, etc.)
   - Clinical AI platforms (e.g., Viz.ai, PathAI, etc.)
   - Healthcare automation tools
   - Radiology AI platforms
   - Drug discovery AI platforms
   - EHR/clinical documentation AI

DO NOT INVENT OR FABRICATE:
- Platform names
- URLs
- Company information

Return JSON with this structure:
{
  "platforms": [
    {
      "name": "Actual Platform Name",
      "url": "https://actual-working-website.com",
      "description": "Brief description of what they actually do",
      "category": "healthcare-ai",
      "founded": "Year or 'Unknown'",
      "knownFor": "What they're specifically known for in healthcare"
    }
  ]
}

EXAMPLES OF REAL PLATFORMS (include similar real platforms):
- Aidoc (aidoc.com) - Radiology AI
- Zebra Medical Vision - Medical imaging
- PathAI (pathai.com) - Pathology AI
- Viz.ai (viz.ai) - Stroke detection
- Tempus (tempus.com) - Precision medicine

Find 20 REAL platforms like these. ONLY include platforms you are certain exist.

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.3);
  return extractJSON(response);
}

async function main() {
  console.log('🏥 Verified Healthcare AI Platform Research\n');
  console.log('='.repeat(60));

  // Step 1: Get platforms from DeepSeek
  const researchData = await researchRealHealthcarePlatforms();

  if (!researchData || !researchData.platforms) {
    console.error('❌ Failed to get platform data');
    process.exit(1);
  }

  console.log(`\n📊 DeepSeek suggested ${researchData.platforms.length} platforms`);
  console.log('🔍 Now verifying each URL...\n');

  // Step 2: Verify each URL actually works
  const verifiedPlatforms = [];
  const failedPlatforms = [];

  for (const platform of researchData.platforms) {
    console.log(`\n${verifiedPlatforms.length + failedPlatforms.length + 1}. ${platform.name}`);

    if (!platform.url) {
      console.log('    ❌ No URL provided');
      failedPlatforms.push({ ...platform, reason: 'No URL' });
      continue;
    }

    const isValid = await verifyURL(platform.url);

    if (isValid) {
      verifiedPlatforms.push(platform);
      console.log(`    ✅ VERIFIED - Adding to list`);
    } else {
      failedPlatforms.push({ ...platform, reason: 'URL not accessible' });
      console.log(`    ❌ FAILED - Skipping`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  // Step 3: Report results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Results:\n');
  console.log(`✅ Verified platforms: ${verifiedPlatforms.length}`);
  console.log(`❌ Failed verification: ${failedPlatforms.length}`);
  console.log('='.repeat(60));

  console.log('\n✅ VERIFIED PLATFORMS:');
  verifiedPlatforms.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} - ${p.url}`);
  });

  if (failedPlatforms.length > 0) {
    console.log('\n❌ FAILED PLATFORMS:');
    failedPlatforms.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - ${p.url || 'N/A'} (${p.reason})`);
    });
  }

  // Step 4: Save verified platforms to a file for review
  const outputPath = path.join(__dirname, '..', 'verified-healthcare-platforms.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    verified: verifiedPlatforms,
    failed: failedPlatforms,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log(`\n💾 Saved results to: verified-healthcare-platforms.json`);
  console.log('\n⚠️  NEXT STEP: Review the verified platforms before adding to database');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
