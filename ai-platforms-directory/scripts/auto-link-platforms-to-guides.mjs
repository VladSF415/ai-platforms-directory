#!/usr/bin/env node
/**
 * Auto-Link Platforms to Guide Pages
 *
 * This script automatically links relevant platforms to guide pages based on:
 * 1. Category matching
 * 2. Keyword matching in platform descriptions
 * 3. Platform tags
 *
 * Usage: node scripts/auto-link-platforms-to-guides.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

// Load platforms
const platformsPath = path.join(projectRoot, 'platforms.json');
const platforms = JSON.parse(fs.readFileSync(platformsPath, 'utf8'));

// Load pillar content
const pillarDir = path.join(projectRoot, 'pillar-content');
const guideFiles = fs.readdirSync(pillarDir).filter(f => f.endsWith('.json'));

console.log('🔗 Auto-Linking Platforms to Guide Pages');
console.log('=========================================\n');
console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✍️  WRITE MODE'}\n`);
console.log(`Found ${platforms.length} platforms`);
console.log(`Found ${guideFiles.length} guide pages\n`);

// Category keyword mapping
const CATEGORY_KEYWORDS = {
  'llm': ['llm', 'large language model', 'gpt', 'claude', 'language model', 'chatbot', 'conversational'],
  'code-ai': ['code', 'coding', 'programming', 'developer', 'github copilot', 'cursor', 'ide'],
  'image-generation': ['image', 'photo', 'picture', 'dalle', 'midjourney', 'stable diffusion', 'flux'],
  'video-generation': ['video', 'movie', 'film', 'runway', 'pika', 'video generation'],
  '3d-generation': ['3d', 'three-dimensional', 'mesh', 'model', 'luma', 'spline', 'kaedim'],
  'content-creation': ['content', 'writing', 'copy', 'blog', 'article', 'seo'],
  'workflow-automation': ['workflow', 'automation', 'zapier', 'n8n', 'automate'],
  'data-analysis': ['data', 'analytics', 'business intelligence', 'visualization'],
  'healthcare-ai': ['healthcare', 'medical', 'health', 'clinical', 'patient', 'diagnosis'],
  'legal-ai': ['legal', 'law', 'contract', 'compliance'],
  'voice-ai': ['voice', 'speech', 'audio', 'tts', 'text-to-speech', 'elevenlabs'],
  'design-creative': ['design', 'creative', 'figma', 'sketch', 'ui', 'ux'],
  'no-code': ['no-code', 'low-code', 'visual builder', 'drag-and-drop'],
  'sales-tools': ['sales', 'crm', 'lead', 'pipeline', 'outreach'],
  'customer-service': ['customer service', 'support', 'helpdesk', 'ticket']
};

/**
 * Find matching platforms for a guide based on category and keywords
 */
function findMatchingPlatforms(guide) {
  const category = guide.category;
  const title = (guide.title || '').toLowerCase();
  const description = (guide.metaDescription || guide.introduction || '').toLowerCase();
  const content = title + ' ' + description;

  const matches = new Set();
  const scores = new Map();

  platforms.forEach(platform => {
    let score = 0;

    // Exact category match (highest priority)
    if (platform.categories && platform.categories.includes(category)) {
      score += 100;
    }

    // Keyword matching
    const keywords = CATEGORY_KEYWORDS[category] || [];
    const platformText = (
      (platform.name || '') + ' ' +
      (platform.description || '') + ' ' +
      (platform.tags || []).join(' ')
    ).toLowerCase();

    keywords.forEach(keyword => {
      if (platformText.includes(keyword) && content.includes(keyword)) {
        score += 10;
      }
    });

    // Featured platforms get bonus
    if (platform.featured) {
      score += 5;
    }

    // Verified platforms get bonus
    if (platform.verified) {
      score += 3;
    }

    if (score > 0) {
      matches.add(platform.id);
      scores.set(platform.id, score);
    }
  });

  // Sort by score and return top matches
  const sorted = Array.from(matches).sort((a, b) => {
    return (scores.get(b) || 0) - (scores.get(a) || 0);
  });

  return {
    all: sorted,
    top: sorted.slice(0, 12),
    featured: sorted.slice(0, 3)
  };
}

// Process each guide
let updated = 0;
let skipped = 0;
let errors = 0;

for (const filename of guideFiles) {
  const filePath = path.join(pillarDir, filename);

  try {
    const guide = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Skip if already has platforms
    if (guide.platforms && guide.platforms.length > 0) {
      skipped++;
      continue;
    }

    // Find matching platforms
    const matches = findMatchingPlatforms(guide);

    if (matches.top.length === 0) {
      console.log(`⚠️  No matches for: ${filename.replace('.json', '')}`);
      skipped++;
      continue;
    }

    // Update guide
    guide.platforms = matches.top;
    guide.featured = matches.featured;

    console.log(`✅ ${filename.replace('.json', '')}`);
    console.log(`   Category: ${guide.category}`);
    console.log(`   Platforms: ${matches.top.length} (${matches.featured.length} featured)`);
    console.log(`   Top 3: ${matches.featured.map(id => {
      const p = platforms.find(pl => pl.id === id);
      return p ? p.name : id;
    }).join(', ')}`);
    console.log('');

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, JSON.stringify(guide, null, 2), 'utf8');
      updated++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    errors++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`✅ Updated: ${updated}`);
console.log(`⏭️  Skipped: ${skipped} (already have platforms)`);
console.log(`❌ Errors: ${errors}`);

if (DRY_RUN) {
  console.log('\n💡 Run without --dry-run to apply changes');
}
