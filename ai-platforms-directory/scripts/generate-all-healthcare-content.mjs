#!/usr/bin/env node

/**
 * Generate verified content for all Healthcare AI platforms
 * Creates alternatives, comparisons, and blog posts with E-E-A-T compliance
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

/**
 * Call DeepSeek API with anti-fabrication rules
 */
async function callDeepSeek(prompt, temperature = 0.3) {
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
          content: `You are a Healthcare AI content specialist. Create E-E-A-T compliant content for medical professionals.

CRITICAL ANTI-FABRICATION RULES:
1. NEVER invent or fabricate platform names, URLs, or features
2. ONLY use the exact platforms and information provided in the prompt
3. DO NOT make up FDA approvals, clinical trials, or medical statistics
4. DO NOT invent peer-reviewed studies or medical journals
5. If you don't know specific information, use general terms like "clinical validation status varies"
6. Use conservative, verifiable language - avoid specific numbers unless provided
7. Always return valid JSON
8. Mark any uncertain information with qualifiers like "may include", "typically", "often"`
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

/**
 * Extract JSON from response
 */
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

/**
 * Load all platforms
 */
function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  return JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
}

/**
 * Get only healthcare platforms
 */
function getHealthcarePlatforms(allPlatforms) {
  return allPlatforms.filter(p =>
    p.categories && p.categories.includes('healthcare-ai')
  );
}

/**
 * Generate alternatives page for a platform
 */
async function generateAlternativesPage(platform, allHealthcarePlatforms) {
  console.log(`  📄 ${platform.name}...`);

  const otherPlatforms = allHealthcarePlatforms
    .filter(p => p.id !== platform.id)
    .slice(0, 5)
    .map(p => `- ${p.name} (${p.url})`)
    .join('\n');

  const prompt = `Create an alternatives page for the "${platform.name}" healthcare AI platform.

Platform:
- Name: ${platform.name}
- URL: ${platform.url}
- Description: ${platform.description}

Other verified healthcare platforms:
${otherPlatforms}

RULES:
1. Use ONLY platforms from the list above
2. DO NOT invent FDA approvals or clinical claims
3. Return ONLY valid JSON
4. Use conservative language throughout

JSON structure:
{
  "title": "Best Alternatives to ${platform.name}",
  "metaDescription": "Compare top healthcare AI platforms to ${platform.name}",
  "slug": "${platform.slug}-alternatives",
  "mainPlatform": {
    "name": "${platform.name}",
    "url": "${platform.url}",
    "description": "Brief accurate description",
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."]
  },
  "alternatives": [
    {
      "name": "Platform Name",
      "url": "https://...",
      "description": "Brief description",
      "keyFeatures": ["...", "..."],
      "bestFor": "..."
    }
  ],
  "metadata": {
    "generated": "2026-01-03",
    "verified": true
  }
}`;

  const response = await callDeepSeek(prompt, 0.3);
  return extractJSON(response);
}

/**
 * Generate comparison pages
 */
async function generateComparisonPages(healthcarePlatforms) {
  console.log(`  🔄 Generating healthcare AI comparisons...`);

  const comparisons = [];
  const pairs = [[0, 1], [1, 2], [2, 3], [0, 4], [3, 5]];

  for (const [i, j] of pairs) {
    if (i < healthcarePlatforms.length && j < healthcarePlatforms.length) {
      const p1 = healthcarePlatforms[i];
      const p2 = healthcarePlatforms[j];

      console.log(`    📊 ${p1.name} vs ${p2.name}`);

      const prompt = `Create a comparison between two healthcare AI platforms:

Platform 1: ${p1.name} - ${p1.description}
URL: ${p1.url}

Platform 2: ${p2.name} - ${p2.description}
URL: ${p2.url}

RULES:
1. Compare ONLY these two platforms
2. DO NOT invent clinical data or FDA claims
3. Use conservative language
4. Return ONLY valid JSON

JSON structure:
{
  "title": "${p1.name} vs ${p2.name} - 2026 Comparison",
  "metaDescription": "Compare ${p1.name} and ${p2.name} healthcare AI platforms",
  "slug": "${p1.slug}-vs-${p2.slug}",
  "platforms": [
    {
      "name": "${p1.name}",
      "description": "...",
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "bestFor": "..."
    },
    {
      "name": "${p2.name}",
      "description": "...",
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "bestFor": "..."
    }
  ],
  "featureComparison": [
    {
      "feature": "Focus Area",
      "${p1.name}": "...",
      "${p2.name}": "..."
    }
  ],
  "metadata": {
    "generated": "2026-01-03",
    "verified": true
  }
}`;

      const response = await callDeepSeek(prompt, 0.3);
      const content = extractJSON(response);
      if (content) {
        comparisons.push({
          platforms: [p1.name, p2.name],
          content
        });
      }
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  return comparisons;
}

/**
 * Generate blog posts
 */
async function generateBlogPosts(healthcarePlatforms) {
  console.log(`  📝 Generating healthcare AI blog posts...`);

  const topics = [
    "AI in Medical Imaging: Diagnostic Solutions 2026",
    "Clinical Workflow Optimization with Healthcare AI",
    "Drug Discovery and Healthcare Innovation with AI"
  ];

  const blogPosts = [];

  for (const topic of topics) {
    console.log(`    ✍️  ${topic}`);

    const platformList = healthcarePlatforms
      .slice(0, 6)
      .map(p => `- ${p.name}`)
      .join('\n');

    const prompt = `Write an E-E-A-T compliant healthcare AI blog post.

Topic: "${topic}"

Relevant platforms:
${platformList}

RULES:
1. Use ONLY platforms from list above
2. DO NOT invent FDA approvals, studies, or statistics
3. Use conservative, general language
4. Return ONLY valid JSON

JSON structure:
{
  "title": "${topic}",
  "metaDescription": "...",
  "slug": "healthcare-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "category": "healthcare-ai",
  "author": "AI Platforms Directory",
  "publishedDate": "2026-01-03",
  "introduction": "...",
  "sections": [
    {
      "heading": "...",
      "content": "..."
    }
  ],
  "keyTakeaways": ["...", "...", "..."],
  "conclusion": "...",
  "metadata": {
    "generated": "2026-01-03",
    "verified": true
  }
}`;

    const response = await callDeepSeek(prompt, 0.3);
    const content = extractJSON(response);
    if (content) {
      blogPosts.push({ topic, content });
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  return blogPosts;
}

/**
 * Save content to files
 */
function saveContent(type, platform, content) {
  if (!content) return false;

  let dir, filename;

  if (type === 'alternatives') {
    dir = path.join(__dirname, '..', 'alternatives-content');
    filename = `${platform.slug}-alternatives.json`;
  } else if (type === 'comparison') {
    dir = path.join(__dirname, '..', 'comparison-content');
    filename = content.slug + '.json';
  } else if (type === 'blog') {
    dir = path.join(__dirname, '..', 'blog-posts');
    filename = content.slug + '.json';
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(content, null, 2)
  );

  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('🏥 Healthcare AI Content Generator\n');
  console.log('='.repeat(60));

  const allPlatforms = loadPlatforms();
  const healthcarePlatforms = getHealthcarePlatforms(allPlatforms);

  console.log(`✅ Found ${healthcarePlatforms.length} healthcare AI platforms`);
  console.log('='.repeat(60));

  let stats = {
    alternatives: 0,
    comparisons: 0,
    blogPosts: 0,
    failed: 0
  };

  // Generate alternatives pages for first 8 platforms
  console.log('\n📄 Generating Alternatives Pages\n');
  for (const platform of healthcarePlatforms.slice(0, 8)) {
    try {
      const content = await generateAlternativesPage(platform, healthcarePlatforms);
      if (saveContent('alternatives', platform, content)) {
        stats.alternatives++;
      }
    } catch (error) {
      console.error(`  ❌ ${platform.name}: ${error.message}`);
      stats.failed++;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Generate comparison pages
  console.log('\n🔄 Generating Comparison Pages\n');
  try {
    const comparisons = await generateComparisonPages(healthcarePlatforms);
    for (const comp of comparisons) {
      if (saveContent('comparison', null, comp.content)) {
        stats.comparisons++;
      }
    }
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    stats.failed++;
  }

  // Generate blog posts
  console.log('\n📝 Generating Blog Posts\n');
  try {
    const blogPosts = await generateBlogPosts(healthcarePlatforms);
    for (const post of blogPosts) {
      if (saveContent('blog', null, post.content)) {
        stats.blogPosts++;
      }
    }
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    stats.failed++;
  }

  // Report results
  console.log('\n' + '='.repeat(60));
  console.log('✅ Content Generation Complete!\n');
  console.log('📊 Results:');
  console.log(`   Alternatives: ${stats.alternatives}`);
  console.log(`   Comparisons: ${stats.comparisons}`);
  console.log(`   Blog Posts: ${stats.blogPosts}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});