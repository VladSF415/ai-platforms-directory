#!/usr/bin/env node

/**
 * E-E-A-T Enrichment Script for Healthcare AI Platforms
 * Enhances platform descriptions with Experience, Expertise, Authoritativeness, Trustworthiness
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

const HEALTHCARE_PLATFORM_IDS = [
  'synapsemd',
  'pharmaforge',
  'clinicmind-ai',
  'voicechart-pro',
  'vitalsense-ai',
  'flowoptima',
  'telemed-ai',
  'mindbalance-ai',
  'genomeai-pro',
  'hospitaliq',
  'cardioscan-ai',
  'immunoai-discovery',
  'surgiplan-ai',
  'mediscribe-ai',
  'neurotrack-ai',
  'staffsync-ai',
  'dermai-scan',
  'therabot-ai',
  'oncomatch-ai',
  'revenuecycle-ai'
];

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
          content: 'You are a medical technology expert specializing in Healthcare AI platforms. You write E-E-A-T compliant content (Experience, Expertise, Authoritativeness, Trustworthiness) for medical professionals. Always return valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: 4000
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

async function enrichPlatformWithEEAT(platform) {
  console.log(`\n🔍 Enriching ${platform.name} with E-E-A-T content...`);

  const prompt = `You are enriching a Healthcare AI platform profile with E-E-A-T compliant content.

CURRENT PLATFORM DATA:
Name: ${platform.name}
Current Description: ${platform.description}
Category: ${platform.category}
Tags: ${platform.tags?.join(', ')}
Features: ${platform.features?.join(', ')}
Pricing: ${platform.pricing}
Use Cases: ${platform.useCases?.join(', ') || 'N/A'}
Target Audience: ${platform.targetAudience || 'Healthcare professionals'}

TASK: Enhance this platform with E-E-A-T compliant content that demonstrates:

1. **Experience** - Real-world clinical applications and outcomes
2. **Expertise** - Deep medical/technical knowledge
3. **Authoritativeness** - Industry recognition, certifications, validations
4. **Trustworthiness** - Security, compliance, reliability

Return enriched platform data in JSON:

{
  "description": "Enhanced 3-4 sentence description with clinical context, real-world applications, and specific medical value proposition. Include measurable impact where possible (e.g., '30% reduction in diagnostic time', 'FDA-cleared for clinical use'). Make it authoritative and trustworthy.",
  "features": [
    "Enhanced feature 1 with specific clinical benefit",
    "Enhanced feature 2 with measurable outcome",
    "Enhanced feature 3 with compliance/certification",
    "Enhanced feature 4 with integration capability",
    "Enhanced feature 5 with security/HIPAA detail",
    "New feature 6 based on medical best practices",
    "New feature 7 demonstrating clinical validation"
  ],
  "keyBenefits": [
    "Clinical benefit 1 with specific outcome",
    "Clinical benefit 2 with measurable impact",
    "Clinical benefit 3 with efficiency gain",
    "Clinical benefit 4 with quality improvement",
    "Clinical benefit 5 with cost/time savings"
  ],
  "useCases": [
    "Detailed clinical use case 1 with specialty/setting",
    "Detailed clinical use case 2 with specific workflow",
    "Detailed clinical use case 3 with patient care impact",
    "Detailed clinical use case 4 with institutional application"
  ],
  "targetAudience": "Specific medical specialties, healthcare settings, or professional roles (e.g., 'Radiologists in hospital settings, imaging centers, and diagnostic labs')",
  "clinicalValidation": "FDA approval status, clinical trial results, peer-reviewed publications, or 'In development' if not yet validated",
  "compliance": ["HIPAA", "Other relevant compliance standards like SOC 2, ISO 27001, GDPR, etc."],
  "integrations": ["EHR system 1", "Medical device/system 2", "Healthcare platform 3", "Standard protocol (HL7/FHIR)"],
  "securityFeatures": [
    "Encryption standard (e.g., AES-256)",
    "Access control feature",
    "Audit logging capability",
    "Data protection measure"
  ],
  "evidenceOfImpact": [
    "Quantifiable outcome 1 (e.g., '25% faster diagnosis')",
    "Clinical study result or publication",
    "Customer testimonial or case study summary",
    "Industry recognition or award"
  ],
  "pricing": "Enhanced pricing with more detail if possible, or keep current: ${platform.pricing}",
  "tags": ${JSON.stringify(platform.tags || [])}
}

IMPORTANT:
- Make descriptions clinical, specific, and authoritative
- Include measurable impacts where possible
- Reference real medical workflows and specialties
- Emphasize compliance, validation, and security
- Be factual and professional - this is for medical professionals

RETURN ONLY THE JSON, NO ADDITIONAL TEXT.`;

  const response = await callDeepSeek(prompt, 0.5);
  return extractJSON(response);
}

async function main() {
  console.log('🏥 E-E-A-T Healthcare Platform Enrichment\n');
  console.log('='.repeat(60));

  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const platforms = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));

  console.log(`📊 Found ${platforms.length} total platforms`);
  console.log(`🎯 Targeting ${HEALTHCARE_PLATFORM_IDS.length} Healthcare AI platforms\n`);

  let enrichedCount = 0;
  let failedCount = 0;

  for (const platformId of HEALTHCARE_PLATFORM_IDS) {
    const platformIndex = platforms.findIndex(p => p.id === platformId);

    if (platformIndex === -1) {
      console.log(`⚠️  Platform not found: ${platformId}`);
      failedCount++;
      continue;
    }

    const platform = platforms[platformIndex];

    try {
      const enrichedData = await enrichPlatformWithEEAT(platform);

      if (!enrichedData) {
        console.log(`  ❌ Failed to enrich ${platform.name}`);
        failedCount++;
        continue;
      }

      // Update platform with enriched data
      platforms[platformIndex] = {
        ...platform,
        description: enrichedData.description,
        features: enrichedData.features || platform.features,
        keyBenefits: enrichedData.keyBenefits || platform.keyBenefits,
        useCases: enrichedData.useCases || platform.useCases,
        targetAudience: enrichedData.targetAudience || platform.targetAudience,
        clinicalValidation: enrichedData.clinicalValidation,
        compliance: enrichedData.compliance,
        integrations: enrichedData.integrations,
        securityFeatures: enrichedData.securityFeatures,
        evidenceOfImpact: enrichedData.evidenceOfImpact,
        pricing: enrichedData.pricing || platform.pricing,
        tags: enrichedData.tags || platform.tags,
        lastEnriched: new Date().toISOString()
      };

      console.log(`  ✅ Enriched ${platform.name}`);
      console.log(`     - Description length: ${enrichedData.description?.length || 0} chars`);
      console.log(`     - Features: ${enrichedData.features?.length || 0}`);
      console.log(`     - Clinical validation: ${enrichedData.clinicalValidation?.substring(0, 50) || 'N/A'}...`);

      enrichedCount++;

      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      console.error(`  ❌ Error enriching ${platform.name}:`, error.message);
      failedCount++;
    }
  }

  // Save enriched platforms
  fs.writeFileSync(platformsPath, JSON.stringify(platforms, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('✅ E-E-A-T Enrichment Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Successfully enriched: ${enrichedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Total platforms: ${platforms.length}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
