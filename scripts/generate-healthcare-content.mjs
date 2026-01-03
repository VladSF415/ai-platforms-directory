#!/usr/bin/env node

/**
 * Healthcare AI Content Generator
 * Generates alternatives, comparisons, and blog posts for verified Healthcare AI platforms
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

// Verified Healthcare AI platforms
const HEALTHCARE_PLATFORM_IDS = [
  'aidoc',
  'viz-ai',
  'paige-ai',
  'pathai',
  'tempus',
  'nuance-dragon-medical',
  'butterfly-iq',
  'enlitic',
  'qure-ai',
  'arterys',
  'cleerly',
  'Caption-Health',
  'regard',
  'corti',
  'rad-ai',
  'eko-health',
  'heartflow',
  'gauss-surgical'
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
          content: 'You are a Healthcare AI content specialist. Create E-E-A-T compliant content (Experience, Expertise, Authoritativeness, Trustworthiness) for medical professionals. Always return valid JSON.'
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

function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  return JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
}

async function generateAlternativesPage(platform, allHealthcarePlatforms) {
  console.log(`  📄 Generating alternatives page for ${platform.name}...`);

  const otherPlatforms = allHealthcarePlatforms
    .filter(p => p.id !== platform.id)
    .slice(0, 10);

  const prompt = `Generate an alternatives page for ${platform.name}, a Healthcare AI platform.

Platform Details:
- Name: ${platform.name}
- Description: ${platform.description}
- URL: ${platform.url}

Alternative Platforms (10 total):
${otherPlatforms.map(p => `- ${p.name} (${p.url}): ${p.description}`).join('\n')}

Create a comprehensive alternatives page in JSON format:

{
  "title": "${platform.name} Alternatives - Best Healthcare AI Platforms 2026",
  "metaDescription": "Explore the best ${platform.name} alternatives. Compare features, pricing, and capabilities of top Healthcare AI platforms for [specific use case].",
  "slug": "${platform.slug || platform.id}-alternatives",
  "mainPlatform": {
    "name": "${platform.name}",
    "description": "Expanded description with clinical context",
    "pros": ["Clinical benefit 1", "Clinical benefit 2", "Clinical benefit 3"],
    "cons": ["Limitation 1", "Limitation 2", "Limitation 3"]
  },
  "alternatives": [
    {
      "name": "Alternative Platform Name",
      "description": "Detailed description with clinical context",
      "url": "actual-url",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
      "bestFor": "Specific clinical use case or specialty",
      "pricing": "Pricing model if known"
    }
  ],
  "comparisonCriteria": [
    "Clinical validation and FDA approval",
    "Specialty focus (radiology, pathology, etc.)",
    "Integration with EHR systems",
    "Pricing and deployment model",
    "HIPAA compliance and security"
  ],
  "faq": [
    {
      "question": "What is the best alternative to ${platform.name}?",
      "answer": "Detailed answer with clinical context..."
    }
  ]
}

IMPORTANT: Use ONLY the platforms listed above. Return ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.5);
  return extractJSON(response);
}

async function generateComparisonPage(platform1, platform2) {
  console.log(`  🔄 Generating comparison: ${platform1.name} vs ${platform2.name}...`);

  const prompt = `Create a detailed comparison between two Healthcare AI platforms:

Platform 1: ${platform1.name}
- Description: ${platform1.description}
- URL: ${platform1.url}

Platform 2: ${platform2.name}
- Description: ${platform2.description}
- URL: ${platform2.url}

Generate a comprehensive comparison in JSON format:

{
  "title": "${platform1.name} vs ${platform2.name} - Healthcare AI Comparison 2026",
  "metaDescription": "Compare ${platform1.name} and ${platform2.name}. Features, pricing, clinical validation, and use cases for healthcare professionals.",
  "slug": "${platform1.slug || platform1.id}-vs-${platform2.slug || platform2.id}",
  "platforms": [
    {
      "name": "${platform1.name}",
      "description": "Clinical-focused description",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "bestFor": "Specific clinical specialty or use case",
      "pricing": "Pricing model if known"
    },
    {
      "name": "${platform2.name}",
      "description": "Clinical-focused description",
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "bestFor": "Specific clinical specialty or use case",
      "pricing": "Pricing model if known"
    }
  ],
  "featureComparison": [
    {
      "feature": "Clinical Validation",
      "${platform1.name}": "FDA status, peer-reviewed studies, etc.",
      "${platform2.name}": "FDA status, peer-reviewed studies, etc."
    },
    {
      "feature": "Specialty Focus",
      "${platform1.name}": "Primary medical specialty",
      "${platform2.name}": "Primary medical specialty"
    }
  ],
  "verdict": "Neutral, evidence-based recommendation based on use case",
  "faq": [
    {
      "question": "Which is better for [specific specialty]?",
      "answer": "Detailed clinical answer..."
    }
  ]
}

Return ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.5);
  return extractJSON(response);
}

async function generateBlogPost(platforms, topic) {
  console.log(`  📝 Generating blog post: ${topic}...`);

  const platformList = platforms.map(p => `- ${p.name}: ${p.description}`).join('\n');

  const prompt = `Write an E-E-A-T compliant blog post for Healthcare AI platforms.

Topic: ${topic}

Available Platforms:
${platformList}

Generate a comprehensive blog post in JSON format:

{
  "title": "SEO-optimized title with year 2026",
  "metaDescription": "Compelling meta description under 160 characters",
  "slug": "url-friendly-slug",
  "category": "healthcare-ai",
  "author": "AI Platforms Directory",
  "publishedDate": "${new Date().toISOString().split('T')[0]}",
  "introduction": "Engaging introduction paragraph that establishes expertise and authority in Healthcare AI",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Detailed content with clinical context, evidence-based information, and specific examples. Include statistics, FDA approvals, clinical validation data where relevant."
    }
  ],
  "platformSpotlight": [
    {
      "name": "Platform Name",
      "description": "Why this platform is relevant to the topic",
      "clinicalEvidence": "FDA approval, peer-reviewed studies, or clinical outcomes"
    }
  ],
  "keyTakeaways": [
    "Evidence-based takeaway 1",
    "Evidence-based takeaway 2",
    "Evidence-based takeaway 3"
  ],
  "faq": [
    {
      "question": "Common clinical question?",
      "answer": "Evidence-based answer with references to clinical studies or guidelines"
    }
  ],
  "conclusion": "Authoritative conclusion that reinforces expertise and provides clear next steps",
  "references": [
    "FDA guidance or clinical study reference 1",
    "Medical journal or authoritative source 2"
  ]
}

IMPORTANT:
- Focus on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Include clinical validation, FDA approvals, peer-reviewed evidence
- Write for healthcare professionals (doctors, radiologists, pathologists)
- Be factual, evidence-based, and professional
- Cite real medical specialties, workflows, and clinical applications

Return ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.7);
  return extractJSON(response);
}

async function main() {
  console.log('🏥 Healthcare AI Content Generator\n');
  console.log('='.repeat(60));

  const allPlatforms = loadPlatforms();
  const healthcarePlatforms = allPlatforms.filter(p =>
    HEALTHCARE_PLATFORM_IDS.includes(p.id)
  );

  console.log(`📊 Found ${healthcarePlatforms.length} Healthcare AI platforms`);
  console.log(`🎯 Generating comprehensive content...\n`);

  let stats = {
    alternatives: 0,
    comparisons: 0,
    blogPosts: 0,
    failed: 0
  };

  // 1. Generate Alternatives Pages (18 pages)
  console.log('📄 Step 1: Generating Alternatives Pages...\n');
  const alternativesDir = path.join(__dirname, '..', 'alternatives-content');
  if (!fs.existsSync(alternativesDir)) {
    fs.mkdirSync(alternativesDir, { recursive: true });
  }

  for (const platform of healthcarePlatforms) {
    try {
      const altPage = await generateAlternativesPage(platform, healthcarePlatforms);

      if (altPage) {
        const filePath = path.join(alternativesDir, `${platform.slug || platform.id}-alternatives.json`);
        fs.writeFileSync(filePath, JSON.stringify(altPage, null, 2));
        console.log(`  ✅ Created: ${platform.slug || platform.id}-alternatives.json`);
        stats.alternatives++;
      }

      await new Promise(r => setTimeout(r, 2000)); // Rate limiting
    } catch (error) {
      console.error(`  ❌ Failed for ${platform.name}:`, error.message);
      stats.failed++;
    }
  }

  // 2. Generate Comparison Pages (Select top platforms for comparisons)
  console.log('\n🔄 Step 2: Generating Comparison Pages...\n');
  const comparisonDir = path.join(__dirname, '..', 'comparison-content');
  if (!fs.existsSync(comparisonDir)) {
    fs.mkdirSync(comparisonDir, { recursive: true });
  }

  // Generate 20 strategic comparisons
  const comparisons = [
    ['aidoc', 'viz-ai'],
    ['pathai', 'paige-ai'],
    ['tempus', 'pathai'],
    ['nuance-dragon-medical', 'aidoc'],
    ['butterfly-iq', 'Caption-Health'],
    ['enlitic', 'qure-ai'],
    ['arterys', 'aidoc'],
    ['cleerly', 'heartflow'],
    ['regard', 'nuance-dragon-medical'],
    ['corti', 'nuance-dragon-medical']
  ];

  for (const [id1, id2] of comparisons) {
    try {
      const p1 = healthcarePlatforms.find(p => p.id === id1);
      const p2 = healthcarePlatforms.find(p => p.id === id2);

      if (!p1 || !p2) continue;

      const compPage = await generateComparisonPage(p1, p2);

      if (compPage) {
        const filePath = path.join(comparisonDir, `${p1.slug || p1.id}-vs-${p2.slug || p2.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(compPage, null, 2));
        console.log(`  ✅ Created: ${p1.slug || p1.id}-vs-${p2.slug || p2.id}.json`);
        stats.comparisons++;
      }

      await new Promise(r => setTimeout(r, 2000)); // Rate limiting
    } catch (error) {
      console.error(`  ❌ Failed comparison:`, error.message);
      stats.failed++;
    }
  }

  // 3. Generate Blog Posts
  console.log('\n📝 Step 3: Generating E-E-A-T Blog Posts...\n');
  const blogDir = path.join(__dirname, '..', 'blog-posts');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  const blogTopics = [
    'Best Healthcare AI Platforms for Medical Imaging in 2026',
    'FDA-Approved AI Tools for Clinical Diagnosis: Complete Guide',
    'AI in Radiology: Top Platforms Transforming Medical Imaging'
  ];

  for (const topic of blogTopics) {
    try {
      const blogPost = await generateBlogPost(healthcarePlatforms, topic);

      if (blogPost) {
        const filePath = path.join(blogDir, `${blogPost.slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(blogPost, null, 2));
        console.log(`  ✅ Created: ${blogPost.slug}.json`);
        stats.blogPosts++;
      }

      await new Promise(r => setTimeout(r, 3000)); // Longer delay for blog posts
    } catch (error) {
      console.error(`  ❌ Failed blog post:`, error.message);
      stats.failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Content Generation Complete!\n');
  console.log('📊 Results:');
  console.log(`   Alternatives Pages: ${stats.alternatives}`);
  console.log(`   Comparison Pages: ${stats.comparisons}`);
  console.log(`   Blog Posts: ${stats.blogPosts}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Total Files: ${stats.alternatives + stats.comparisons + stats.blogPosts}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
