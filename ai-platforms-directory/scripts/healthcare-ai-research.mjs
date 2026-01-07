#!/usr/bin/env node

/**
 * Healthcare AI Platform Research & Content Generator
 * Uses DeepSeek to find, validate, and create comprehensive content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
config({ path: path.join(__dirname, '..', '.env') });

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY environment variable not set');
  console.error('   Please set it in .env file or as an environment variable');
  console.error('   Example: DEEPSEEK_API_KEY=your-key-here node scripts/healthcare-ai-research.mjs');
  process.exit(1);
}

async function callDeepSeek(prompt, temperature = 0.7, maxTokens = 8000) {
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
          content: 'You are an expert Healthcare AI researcher with deep knowledge of medical technology, AI platforms, and digital health solutions. Always return valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
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

async function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const data = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
  return Array.isArray(data) ? data : (data.platforms || []);
}

async function researchHealthcareAIPlatforms(existingPlatforms) {
  console.log('🔍 Using DeepSeek to research 20 Healthcare AI platforms...\n');

  const existingNames = existingPlatforms
    .filter(p => p.category === 'healthcare-ai' || p.tags?.includes('Healthcare'))
    .map(p => p.name.toLowerCase());

  const prompt = `Research and identify 20 innovative Healthcare AI platforms launched or updated in 2025-2026.

EXISTING HEALTHCARE AI PLATFORMS TO AVOID (do NOT include these):
${existingNames.join(', ')}

FOCUS AREAS:
1. Medical imaging & radiology AI
2. Drug discovery & pharmaceutical AI
3. Clinical decision support systems
4. Medical transcription & documentation AI
5. Patient monitoring & diagnostics
6. Healthcare operations & workflow AI
7. Telemedicine AI platforms
8. Mental health AI platforms
9. Genomics & personalized medicine AI
10. Hospital management AI

For each platform, provide comprehensive research-verified information.

Return ONLY valid JSON in this EXACT format:
{
  "platforms": [
    {
      "name": "Platform Name",
      "url": "https://official-website.com",
      "description": "Detailed 2-3 sentence description of what the platform does and its unique value proposition",
      "pricing": "Pricing model (e.g., 'Free tier available, Paid plans from $X/month', 'Enterprise only', 'Contact for pricing')",
      "category": "healthcare-ai",
      "categories": ["healthcare-ai", "relevant-subcategory"],
      "tags": ["Relevant", "Healthcare", "Tags"],
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
      "rating": 4.5,
      "verified": false,
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "useCases": ["Use case 1", "Use case 2"],
      "targetAudience": "Who uses this platform"
    }
  ]
}

CRITICAL REQUIREMENTS:
- All 20 platforms must be REAL, currently active platforms
- Must NOT duplicate any existing platforms listed above
- Include accurate URLs and current information
- Focus on platforms with significant healthcare impact
- Prioritize platforms with FDA approval or clinical validation where applicable

RETURN ONLY THE JSON, NO ADDITIONAL TEXT.`;

  const response = await callDeepSeek(prompt, 0.3, 8000);
  return extractJSON(response);
}

async function generateAlternativesPage(platform, similarPlatforms) {
  console.log(`  📄 Generating alternatives page for ${platform.name}...`);

  const altList = similarPlatforms.slice(0, 10).map(p => `
- ${p.name}: ${p.description}
  Pricing: ${p.pricing || 'N/A'}`).join('\n');

  const prompt = `Generate a comprehensive "Best ${platform.name} Alternatives" page for healthcare professionals.

MAIN PLATFORM: ${platform.name}
- Description: ${platform.description}
- Pricing: ${platform.pricing}
- Use Cases: ${platform.useCases?.join(', ') || 'Healthcare applications'}

ALTERNATIVES TO COVER:
${altList}

Create detailed, E-E-A-T compliant content (Experience, Expertise, Authoritativeness, Trustworthiness).

Return JSON with this structure:
{
  "slug": "${platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-alternatives",
  "platformSlug": "${platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "title": "Best ${platform.name} Alternatives in 2026: Top Healthcare AI Solutions",
  "metaDescription": "150-160 char SEO description",
  "introduction": "400+ word introduction explaining why healthcare providers seek alternatives, include clinical context",
  "mainPlatformAnalysis": {
    "overview": "Clinical overview of ${platform.name}",
    "limitations": ["limitation 1", "limitation 2", "limitation 3"],
    "pricing": "Detailed pricing analysis",
    "bestFor": "Ideal healthcare use cases",
    "clinicalValidation": "FDA approval status or clinical validation info"
  },
  "alternatives": [
    {
      "name": "Alternative name",
      "slug": "alternative-slug",
      "rank": 1,
      "tagline": "Clinical value proposition",
      "description": "200+ word detailed description with healthcare focus",
      "pricing": "Pricing details",
      "bestFor": "Primary clinical use case",
      "keyFeatures": ["feature1", "feature2", "feature3"],
      "clinicalValidation": "FDA/clinical validation status",
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2"],
      "whySwitch": "Clinical reasons to switch"
    }
  ],
  "comparisonTable": {
    "criteria": ["Pricing", "Clinical Accuracy", "Integration", "Compliance", "Support"],
    "scores": {}
  },
  "howToChoose": {
    "title": "How to Choose the Right Healthcare AI Platform",
    "factors": [
      {"name": "Factor", "description": "Clinical importance"}
    ]
  },
  "verdict": "300+ word clinical verdict with specific recommendations",
  "faqs": [
    {"question": "Clinical FAQ 1?", "answer": "Detailed answer"},
    {"question": "Is this HIPAA compliant?", "answer": "Compliance details"},
    {"question": "Clinical FAQ 3?", "answer": "Detailed answer"}
  ]
}

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.7, 8000);
  return extractJSON(response);
}

async function generateComparisonPage(platform1, platform2) {
  console.log(`  🔄 Generating comparison: ${platform1.name} vs ${platform2.name}...`);

  const prompt = `Generate a comprehensive clinical comparison: "${platform1.name}" vs "${platform2.name}"

PLATFORM 1: ${platform1.name}
- Description: ${platform1.description}
- Pricing: ${platform1.pricing}
- Use Cases: ${platform1.useCases?.join(', ') || 'N/A'}

PLATFORM 2: ${platform2.name}
- Description: ${platform2.description}
- Pricing: ${platform2.pricing}
- Use Cases: ${platform2.useCases?.join(', ') || 'N/A'}

Create E-E-A-T compliant comparison with clinical focus.

Return JSON:
{
  "slug": "${platform1.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vs-${platform2.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "platform1Slug": "${platform1.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "platform2Slug": "${platform2.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "title": "${platform1.name} vs ${platform2.name}: Clinical Comparison 2026",
  "metaDescription": "150-160 char SEO description",
  "introduction": "300+ word clinical introduction",
  "sections": [
    {
      "title": "Clinical Overview",
      "paragraphs": ["paragraph1", "paragraph2"]
    },
    {
      "title": "Pricing & ROI Analysis",
      "paragraphs": ["detailed pricing comparison"]
    },
    {
      "title": "Clinical Features & Accuracy",
      "paragraphs": ["feature comparison with clinical metrics"]
    },
    {
      "title": "Regulatory Compliance",
      "paragraphs": ["HIPAA, FDA, compliance comparison"]
    },
    {
      "title": "Integration & Workflow",
      "paragraphs": ["EHR integration, clinical workflow impact"]
    }
  ],
  "comparisonTable": {
    "criteria": ["Pricing", "Clinical Accuracy", "FDA Status", "HIPAA Compliance", "EHR Integration"],
    "platform1Scores": [8, 9, 8, 9, 8],
    "platform2Scores": [7, 8, 9, 9, 7]
  },
  "verdict": "400+ word clinical verdict with specific recommendations for different healthcare settings",
  "faqs": [
    {"question": "Which is better for hospital settings?", "answer": "Detailed answer"},
    {"question": "Compliance comparison?", "answer": "Detailed answer"},
    {"question": "Clinical FAQ?", "answer": "Detailed answer"}
  ]
}

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.7, 8000);
  return extractJSON(response);
}

async function generateBlogPost(platforms, topic) {
  console.log(`  📝 Generating E-E-A-T blog post: ${topic}...`);

  const platformList = platforms.slice(0, 10).map(p => `- ${p.name}: ${p.description}`).join('\n');

  const prompt = `Write a comprehensive, E-E-A-T compliant blog post about: "${topic}"

PLATFORMS TO FEATURE:
${platformList}

E-E-A-T REQUIREMENTS:
- Experience: Include real-world healthcare examples
- Expertise: Demonstrate deep clinical knowledge
- Authoritativeness: Reference clinical studies, FDA approvals
- Trustworthiness: Accurate, balanced, evidence-based

Return JSON:
{
  "slug": "${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "title": "${topic} - Clinical Guide 2026",
  "metaDescription": "150-160 char SEO description",
  "author": "Healthcare AI Editorial Team",
  "publishDate": "2026-01-03",
  "category": "Healthcare AI",
  "tags": ["Healthcare", "AI", "Clinical Technology"],
  "featuredImage": "/images/healthcare-ai-blog.jpg",
  "introduction": "Compelling 2-3 paragraph introduction with clinical relevance",
  "sections": [
    {
      "heading": "Section Title",
      "content": "500+ word detailed content with clinical examples",
      "subsections": [
        {
          "heading": "Subsection",
          "content": "Detailed clinical information"
        }
      ]
    }
  ],
  "platformReviews": [
    {
      "name": "Platform Name",
      "slug": "platform-slug",
      "review": "300+ word clinical review with specific features, benefits, and use cases",
      "rating": 4.5,
      "pros": ["Clinical pro 1", "Clinical pro 2"],
      "cons": ["Limitation 1", "Limitation 2"],
      "bestFor": "Specific clinical use case"
    }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "conclusion": "300+ word conclusion with actionable clinical recommendations",
  "faqs": [
    {"question": "Clinical question?", "answer": "Evidence-based answer"}
  ],
  "references": [
    "Clinical study or authoritative source 1",
    "FDA guidance or medical journal 2"
  ]
}

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.7, 8000);
  return extractJSON(response);
}

async function generatePillarGuide(platforms, guideTitle) {
  console.log(`  📚 Generating pillar guide: ${guideTitle}...`);

  const platformList = platforms.map(p => `- ${p.name}: ${p.description}`).join('\n');

  const prompt = `Create a comprehensive pillar guide: "${guideTitle}"

This is an authoritative, long-form guide (3000+ words) with E-E-A-T compliance.

PLATFORMS TO COVER:
${platformList}

Return JSON:
{
  "slug": "${guideTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "title": "${guideTitle}",
  "metaDescription": "150-160 char comprehensive SEO description",
  "category": "Pillar Guides",
  "publishDate": "2026-01-03",
  "author": "Healthcare AI Research Team",
  "readingTime": "25 min read",
  "introduction": "500+ word introduction establishing authority and clinical relevance",
  "tableOfContents": [
    {"title": "Chapter 1", "anchor": "#chapter-1"},
    {"title": "Chapter 2", "anchor": "#chapter-2"}
  ],
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter Title",
      "content": "1000+ word comprehensive content",
      "keyPoints": ["Point 1", "Point 2"],
      "clinicalExamples": [
        {
          "hospital": "Example Medical Center",
          "challenge": "Clinical challenge",
          "solution": "How AI helped",
          "results": "Measurable outcomes"
        }
      ]
    }
  ],
  "platformComparison": {
    "introduction": "Comparison overview",
    "platforms": [
      {
        "name": "Platform Name",
        "slug": "platform-slug",
        "overview": "Comprehensive overview",
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1"],
        "idealFor": "Best use cases",
        "pricing": "Pricing analysis",
        "clinicalValidation": "FDA/validation status"
      }
    ]
  },
  "implementationGuide": {
    "title": "Implementation Roadmap",
    "steps": [
      {
        "step": 1,
        "title": "Step Title",
        "description": "Detailed implementation step",
        "timeline": "Estimated timeline",
        "considerations": ["Consideration 1", "Consideration 2"]
      }
    ]
  },
  "bestPractices": [
    {
      "title": "Best Practice Title",
      "description": "Detailed clinical best practice",
      "tips": ["Tip 1", "Tip 2"]
    }
  ],
  "futureOutlook": "500+ word analysis of future trends in healthcare AI",
  "conclusion": "300+ word conclusion with actionable recommendations",
  "resources": [
    {"title": "Resource 1", "url": "URL", "description": "Description"},
    {"title": "Resource 2", "url": "URL", "description": "Description"}
  ],
  "faqs": [
    {"question": "Comprehensive question?", "answer": "Detailed answer"}
  ]
}

RETURN ONLY JSON.`;

  const response = await callDeepSeek(prompt, 0.7, 8000);
  return extractJSON(response);
}

async function main() {
  console.log('🚀 Healthcare AI Research & Content Generation System\n');
  console.log('=' .repeat(60));

  const allPlatforms = await loadPlatforms();

  // Step 1: Research new platforms
  const researchData = await researchHealthcareAIPlatforms(allPlatforms);

  if (!researchData || !researchData.platforms) {
    console.error('❌ Failed to research platforms');
    process.exit(1);
  }

  const newPlatforms = researchData.platforms.slice(0, 20);
  console.log(`✅ Found ${newPlatforms.length} new Healthcare AI platforms\n`);

  // Add platform metadata
  const timestamp = new Date().toISOString();
  newPlatforms.forEach((platform, idx) => {
    platform.id = platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    platform.slug = platform.id;
    platform.created_at = timestamp;
    platform.added_date = timestamp;
    platform.category = 'healthcare-ai';
    if (!platform.categories) {
      platform.categories = ['healthcare-ai'];
    }
  });

  console.log('New Platforms:');
  newPlatforms.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`));
  console.log();

  // Step 2: Add to platforms.json
  console.log('💾 Adding platforms to database...\n');
  allPlatforms.push(...newPlatforms);
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  fs.writeFileSync(platformsPath, JSON.stringify(allPlatforms, null, 2));
  console.log(`✅ Updated platforms.json (${allPlatforms.length} total platforms)\n`);

  // Step 3: Generate Alternatives Pages
  console.log('📄 Generating Alternatives Pages...\n');
  const alternativesDir = path.join(__dirname, '..', 'alternatives-content');
  let altCount = 0;

  for (const platform of newPlatforms) {
    const healthcarePlatforms = allPlatforms.filter(p =>
      p.id !== platform.id &&
      (p.category === 'healthcare-ai' || p.tags?.includes('Healthcare'))
    );

    if (healthcarePlatforms.length >= 5) {
      const altPage = await generateAlternativesPage(platform, healthcarePlatforms.slice(0, 12));
      if (altPage) {
        fs.writeFileSync(
          path.join(alternativesDir, `${altPage.slug}.json`),
          JSON.stringify(altPage, null, 2)
        );
        console.log(`  ✅ ${++altCount}. ${platform.name} Alternatives`);
        await new Promise(r => setTimeout(r, 2000)); // Rate limiting
      }
    }
  }

  // Step 4: Generate Comparison Pages
  console.log(`\n🔄 Generating Comparison Pages...\n`);
  const comparisonDir = path.join(__dirname, '..', 'comparison-content');
  let compCount = 0;

  for (const platform of newPlatforms.slice(0, 10)) {
    const healthcarePlatforms = allPlatforms.filter(p =>
      p.id !== platform.id &&
      (p.category === 'healthcare-ai' || p.tags?.includes('Healthcare'))
    );

    for (const comparePlatform of healthcarePlatforms.slice(0, 3)) {
      const compPage = await generateComparisonPage(platform, comparePlatform);
      if (compPage) {
        fs.writeFileSync(
          path.join(comparisonDir, `${compPage.slug}.json`),
          JSON.stringify(compPage, null, 2)
        );
        console.log(`  ✅ ${++compCount}. ${platform.name} vs ${comparePlatform.name}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // Step 5: Generate Blog Posts
  console.log(`\n📝 Generating E-E-A-T Blog Posts...\n`);
  const blogDir = path.join(__dirname, '..', 'blog-posts');
  const blogTopics = [
    'Top Healthcare AI Platforms Transforming Patient Care in 2026',
    'AI in Medical Imaging: Complete Guide for Radiologists',
    'How AI is Revolutionizing Drug Discovery and Development'
  ];

  let blogCount = 0;
  for (const topic of blogTopics) {
    const blogPost = await generateBlogPost(newPlatforms, topic);
    if (blogPost) {
      fs.writeFileSync(
        path.join(blogDir, `${blogPost.slug}.json`),
        JSON.stringify(blogPost, null, 2)
      );
      console.log(`  ✅ ${++blogCount}. ${topic}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Step 6: Generate Pillar Guides
  console.log(`\n📚 Generating Pillar Guides...\n`);
  const pillarDir = path.join(__dirname, '..', 'pillar-content');
  const pillarTopics = [
    'Complete Guide to Healthcare AI: Implementation, Benefits & Best Practices 2026',
    'Clinical Decision Support Systems: Comprehensive Healthcare AI Guide'
  ];

  let pillarCount = 0;
  for (const topic of pillarTopics) {
    const pillarGuide = await generatePillarGuide(newPlatforms, topic);
    if (pillarGuide) {
      fs.writeFileSync(
        path.join(pillarDir, `${pillarGuide.slug}.json`),
        JSON.stringify(pillarGuide, null, 2)
      );
      console.log(`  ✅ ${++pillarCount}. ${topic}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Healthcare AI Content Generation Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Platforms added: ${newPlatforms.length}`);
  console.log(`   Alternatives pages: ${altCount}`);
  console.log(`   Comparison pages: ${compCount}`);
  console.log(`   Blog posts: ${blogCount}`);
  console.log(`   Pillar guides: ${pillarCount}`);
  console.log(`   Total new content: ${altCount + compCount + blogCount + pillarCount} pages`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
