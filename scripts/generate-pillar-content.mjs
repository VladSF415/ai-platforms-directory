#!/usr/bin/env node

/**
 * Pillar Content Generation Script
 * Uses DeepSeek AI to generate comprehensive 3,000-5,000 word pillar pages
 *
 * Usage:
 *   node scripts/generate-pillar-content.mjs --category code-ai
 *   node scripts/generate-pillar-content.mjs --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ ERROR: DEEPSEEK_API_KEY environment variable not set');
  console.log('Set it with: export DEEPSEEK_API_KEY=your-api-key');
  process.exit(1);
}

// Base category metadata (can be extended dynamically)
const BASE_CATEGORIES = {
  'code-ai': {
    name: 'Code AI',
    fullName: 'AI Coding Assistants',
    description: 'AI-powered tools for code generation, completion, and developer productivity',
    targetKeywords: ['AI coding assistant', 'code AI tools', 'AI code generator', 'GitHub Copilot alternative']
  },
  'llms': {
    name: 'LLMs',
    fullName: 'Large Language Models',
    description: 'Advanced AI language models for text generation, conversation, and reasoning',
    targetKeywords: ['large language models', 'LLM tools', 'ChatGPT alternatives', 'AI chatbots']
  },
  'generative-ai': {
    name: 'Generative AI',
    fullName: 'Generative AI Tools',
    description: 'AI tools for generating text, images, videos, and creative content',
    targetKeywords: ['generative AI tools', 'AI content creation', 'text to image AI', 'AI art generator']
  },
  'computer-vision': {
    name: 'Computer Vision',
    fullName: 'Computer Vision AI',
    description: 'AI tools for image recognition, object detection, and visual analysis',
    targetKeywords: ['computer vision tools', 'image recognition AI', 'object detection', 'facial recognition AI']
  },
  'nlp': {
    name: 'NLP',
    fullName: 'Natural Language Processing',
    description: 'AI tools for text analysis, sentiment detection, and language understanding',
    targetKeywords: ['NLP tools', 'text analysis AI', 'sentiment analysis', 'entity extraction']
  },
  'image-generation': {
    name: 'Image Generation',
    fullName: 'AI Image Generators',
    description: 'Text-to-image AI tools and creative image generation platforms',
    targetKeywords: ['AI image generator', 'text to image', 'Midjourney alternative', 'AI art tools']
  },
  'video-ai': {
    name: 'Video AI',
    fullName: 'AI Video Tools',
    description: 'AI-powered video editing, enhancement, and production tools',
    targetKeywords: ['AI video editor', 'video AI tools', 'AI video enhancement', 'automatic video editing']
  },
  'ml-frameworks': {
    name: 'ML Frameworks',
    fullName: 'Machine Learning Frameworks',
    description: 'Frameworks and platforms for building and deploying ML models',
    targetKeywords: ['ML framework', 'machine learning platform', 'TensorFlow alternative', 'PyTorch tools']
  },
  'analytics-bi': {
    name: 'Analytics & BI',
    fullName: 'AI Analytics and Business Intelligence',
    description: 'AI-powered data analytics, visualization, and business intelligence tools',
    targetKeywords: ['AI analytics', 'business intelligence AI', 'data visualization AI', 'automated insights']
  },
  'agent-platforms': {
    name: 'Agent Platforms',
    fullName: 'AI Agent Platforms',
    description: 'Platforms for building and deploying autonomous AI agents',
    targetKeywords: ['AI agent platform', 'autonomous AI', 'AI workflow automation', 'agent builder']
  },
  'data-governance': {
    name: 'Data Governance',
    fullName: 'AI Data Governance Tools',
    description: 'Tools for managing, securing, and governing AI data and models',
    targetKeywords: ['AI data governance', 'ML data management', 'model governance', 'AI compliance']
  },
  'video-generation': {
    name: 'Video Generation',
    fullName: 'AI Video Generation Tools',
    description: 'AI tools for creating and generating videos from text, images, or other inputs',
    targetKeywords: ['AI video generator', 'text to video AI', 'AI video creation', 'automated video production']
  },
  'website-ai': {
    name: 'Website AI',
    fullName: 'AI Website Builders',
    description: 'AI-powered website builders and design tools',
    targetKeywords: ['AI website builder', 'AI web design', 'automated website creation', 'AI landing page builder']
  },
  'workflow-automation': {
    name: 'Workflow Automation',
    fullName: 'AI Workflow Automation',
    description: 'AI tools for automating business workflows and processes',
    targetKeywords: ['AI workflow automation', 'business process automation', 'AI process optimization', 'automated workflows']
  },
  'audio-ai': {
    name: 'Audio AI',
    fullName: 'AI Audio Tools',
    description: 'AI-powered audio generation, voice synthesis, and audio processing tools',
    targetKeywords: ['AI voice generator', 'text to speech AI', 'AI audio tools', 'voice cloning AI', 'AI music generator']
  },
  'search-ai': {
    name: 'Search AI',
    fullName: 'AI Search Tools',
    description: 'AI-powered search engines, semantic search, and information retrieval platforms',
    targetKeywords: ['AI search engine', 'semantic search', 'vector search AI', 'AI information retrieval']
  },
  '3d-generation': {
    name: '3D Generation',
    fullName: 'AI 3D Generation Tools',
    description: 'AI tools for generating 3D models, scenes, and environments from text or images',
    targetKeywords: ['AI 3D generator', 'text to 3D AI', '3D model AI', 'AI 3D creation']
  },
  'document-ai': {
    name: 'Document AI',
    fullName: 'AI Document Processing',
    description: 'AI tools for document analysis, OCR, extraction, and processing',
    targetKeywords: ['AI document processing', 'intelligent document processing', 'AI OCR', 'document extraction AI']
  },
  'robotics-ai': {
    name: 'Robotics AI',
    fullName: 'AI Robotics Platforms',
    description: 'AI platforms for robotics, automation, and physical world AI applications',
    targetKeywords: ['AI robotics', 'robotic automation', 'AI robot platform', 'autonomous robots']
  },
  'healthcare-ai': {
    name: 'Healthcare AI',
    fullName: 'AI Healthcare Tools',
    description: 'AI tools for healthcare, medical imaging, diagnostics, and patient care',
    targetKeywords: ['AI healthcare', 'medical AI', 'AI diagnostics', 'healthcare automation AI']
  },
  'finance-ai': {
    name: 'Finance AI',
    fullName: 'AI Finance Tools',
    description: 'AI tools for financial analysis, trading, risk assessment, and fintech',
    targetKeywords: ['AI finance', 'AI trading', 'financial AI tools', 'AI risk assessment']
  },
  'marketing-ai': {
    name: 'Marketing AI',
    fullName: 'AI Marketing Tools',
    description: 'AI-powered marketing automation, content creation, and campaign optimization',
    targetKeywords: ['AI marketing', 'marketing automation AI', 'AI content marketing', 'AI advertising']
  },
  'sales-ai': {
    name: 'Sales AI',
    fullName: 'AI Sales Tools',
    description: 'AI tools for sales automation, lead generation, and CRM enhancement',
    targetKeywords: ['AI sales tools', 'sales automation AI', 'AI lead generation', 'AI CRM']
  },
  'customer-service-ai': {
    name: 'Customer Service AI',
    fullName: 'AI Customer Service Tools',
    description: 'AI chatbots, support automation, and customer experience tools',
    targetKeywords: ['AI customer service', 'AI chatbot', 'customer support AI', 'AI help desk']
  },
  'legal-ai': {
    name: 'Legal AI',
    fullName: 'AI Legal Tools',
    description: 'AI tools for legal research, contract analysis, and legal automation',
    targetKeywords: ['AI legal', 'legal AI tools', 'contract analysis AI', 'AI law']
  },
  'education-ai': {
    name: 'Education AI',
    fullName: 'AI Education Tools',
    description: 'AI tools for learning, tutoring, course creation, and educational content',
    targetKeywords: ['AI education', 'AI tutoring', 'educational AI', 'AI learning platform']
  },
  'security-ai': {
    name: 'Security AI',
    fullName: 'AI Security Tools',
    description: 'AI-powered cybersecurity, threat detection, and security automation',
    targetKeywords: ['AI security', 'AI cybersecurity', 'threat detection AI', 'security automation']
  },
  'hr-ai': {
    name: 'HR AI',
    fullName: 'AI HR Tools',
    description: 'AI tools for recruiting, employee management, and HR automation',
    targetKeywords: ['AI HR', 'AI recruiting', 'HR automation AI', 'AI talent management']
  },
  'ecommerce-ai': {
    name: 'E-commerce AI',
    fullName: 'AI E-commerce Tools',
    description: 'AI tools for e-commerce optimization, product recommendations, and retail automation',
    targetKeywords: ['AI ecommerce', 'AI product recommendations', 'retail AI', 'ecommerce automation']
  }
};

// Generate category metadata dynamically for unknown categories
function generateCategoryMeta(slug, platforms) {
  // Check if we have a predefined category
  if (BASE_CATEGORIES[slug]) {
    return BASE_CATEGORIES[slug];
  }

  // Generate metadata based on the slug
  const words = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
  const name = words.join(' ');
  const fullName = `AI ${name} Tools`;

  // Get descriptions from platforms in this category to help with keywords
  const platformDescriptions = platforms
    .filter(p => p.category === slug)
    .slice(0, 5)
    .map(p => p.description || '')
    .join(' ');

  // Extract common words for keywords
  const commonKeywords = [
    `AI ${name.toLowerCase()}`,
    `${name.toLowerCase()} AI tools`,
    `best ${name.toLowerCase()} AI`,
    `${name.toLowerCase()} automation`
  ];

  return {
    name: name,
    fullName: fullName,
    description: `AI-powered ${name.toLowerCase()} tools and platforms`,
    targetKeywords: commonKeywords
  };
}

// Get all categories from platforms.json (dynamic discovery)
function discoverCategories(platforms) {
  const categoryCounts = {};
  platforms.forEach(p => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  // Build CATEGORIES object dynamically
  const CATEGORIES = { ...BASE_CATEGORIES };

  Object.keys(categoryCounts).forEach(slug => {
    if (!CATEGORIES[slug]) {
      CATEGORIES[slug] = generateCategoryMeta(slug, platforms);
      console.log(`📦 Discovered new category: ${slug} (${categoryCounts[slug]} platforms)`);
    }
  });

  return CATEGORIES;
}

// Will be populated after loading platforms
let CATEGORIES = { ...BASE_CATEGORIES };

async function loadPlatforms() {
  const platformsPath = path.join(__dirname, '..', 'platforms.json');
  const data = JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
  // platforms.json is an array directly, not { platforms: [...] }
  const platforms = Array.isArray(data) ? data : (data.platforms || []);

  // Discover and register all categories from platforms
  CATEGORIES = discoverCategories(platforms);

  return platforms;
}

async function generatePillarContent(category, platforms) {
  console.log(`\n🤖 Generating pillar content for: ${CATEGORIES[category].fullName}`);
  console.log(`📊 ${platforms.length} platforms in this category`);

  const categoryMeta = CATEGORIES[category];
  const topPlatforms = platforms.slice(0, 10).map(p => `- ${p.name}: ${p.description || 'N/A'}`).join('\n');

  const prompt = `You are an expert SEO content writer for aiplatformslist.com, creating a comprehensive pillar page guide.

TASK: Generate a detailed, SEO-optimized pillar page for "${categoryMeta.fullName}" AI tools.

TARGET KEYWORDS: ${categoryMeta.targetKeywords.join(', ')}
WORD COUNT: 3,000-5,000 words minimum
TONE: Professional, authoritative, helpful

TOP PLATFORMS IN CATEGORY:
${topPlatforms}

OUTPUT FORMAT: JSON structure matching this schema:
{
  "slug": "ultimate-guide-${category}-ai-tools-2026",
  "category": "${category}",
  "title": "Ultimate Guide to ${categoryMeta.fullName} in 2026",
  "metaDescription": "150-160 character SEO-optimized description",
  "introduction": "1-2 paragraph compelling introduction (300-400 words)",
  "whatIsSection": {
    "title": "What are ${categoryMeta.fullName}?",
    "content": ["paragraph 1", "paragraph 2", "paragraph 3"]
  },
  "keyBenefits": [
    "benefit 1",
    "benefit 2",
    "benefit 3",
    "benefit 4",
    "benefit 5"
  ],
  "useCases": [
    {
      "title": "Use Case 1 Title",
      "description": "Detailed description"
    }
  ],
  "howToChoose": {
    "title": "How to Choose the Best ${categoryMeta.fullName} Tool",
    "steps": [
      {
        "name": "Step 1 Name",
        "text": "Detailed step description"
      }
    ]
  },
  "comparisonCriteria": [
    "criteria 1",
    "criteria 2",
    "criteria 3",
    "criteria 4",
    "criteria 5"
  ],
  "faqs": [
    {
      "question": "Question 1?",
      "answer": "Comprehensive answer (100+ words)"
    }
  ]
}

REQUIREMENTS:
1. Introduction: 300-400 words, mention top platforms, explain value proposition
2. What Is Section: 3-4 paragraphs explaining the technology, applications, target users
3. Key Benefits: 5-7 specific, actionable benefits
4. Use Cases: 5-8 detailed real-world use cases with descriptions
5. How to Choose: 5-7 step-by-step guide with actionable advice
6. Comparison Criteria: 5-7 evaluation factors we use
7. FAQs: 8-10 questions with comprehensive 100+ word answers

SEO OPTIMIZATION:
- Use target keywords naturally throughout
- Include long-tail variations
- Mention specific platform names where relevant
- Focus on user intent and value
- Include "2026" for freshness

RETURN ONLY THE JSON OUTPUT, NO ADDITIONAL TEXT.`;

  try {
    console.log('🔄 Calling DeepSeek API...');

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
            content: 'You are an expert SEO content writer specializing in AI tools and software. You generate comprehensive, well-researched pillar content that ranks well in search engines.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response (sometimes wrapped in markdown)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.match(/```json\n([\s\S]*?)\n```/)[1];
    } else if (content.includes('```')) {
      jsonContent = content.match(/```\n([\s\S]*?)\n```/)[1];
    }

    const pillarData = JSON.parse(jsonContent);

    console.log(`✅ Generated ${JSON.stringify(pillarData).length} characters of content`);
    return pillarData;

  } catch (error) {
    console.error('❌ Error generating content:', error.message);
    throw error;
  }
}

async function savePillarContent(content) {
  const outputDir = path.join(__dirname, '..', 'pillar-content');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${content.slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

  console.log(`💾 Saved: ${outputPath}`);
  return outputPath;
}

async function generateForCategory(category) {
  // Load platforms first to discover all categories
  const platforms = await loadPlatforms();

  // Check if category exists (after dynamic discovery)
  if (!CATEGORIES[category]) {
    console.error(`❌ Unknown category: ${category}`);
    console.log(`Available categories: ${Object.keys(CATEGORIES).join(', ')}`);
    return;
  }

  const categoryPlatforms = platforms.filter(p => p.category === category);

  if (categoryPlatforms.length === 0) {
    console.warn(`⚠️  No platforms found for category: ${category}`);
    return;
  }

  const content = await generatePillarContent(category, categoryPlatforms);
  await savePillarContent(content);

  console.log(`\n🎉 Successfully generated pillar page for ${CATEGORIES[category].fullName}`);
  console.log(`📝 Slug: ${content.slug}`);
  console.log(`📊 Word count: ~${JSON.stringify(content).length / 5} words (estimated)`);
}

async function generateAll() {
  console.log('🚀 Generating pillar content for ALL categories...\n');

  const platforms = await loadPlatforms();
  // Get all unique categories from platforms (dynamic discovery already happened in loadPlatforms)
  const categoriesWithPlatforms = [...new Set(platforms.map(p => p.category).filter(Boolean))];

  console.log(`📊 Found ${categoriesWithPlatforms.length} categories with platforms\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const category of categoriesWithPlatforms) {
    // All categories should be in CATEGORIES now after dynamic discovery
    if (!CATEGORIES[category]) {
      console.log(`⏭️  Skipping unknown category: ${category}`);
      continue;
    }

    try {
      const categoryPlatforms = platforms.filter(p => p.category === category);

      if (categoryPlatforms.length === 0) {
        console.warn(`⚠️  No platforms found for category: ${category}`);
        continue;
      }

      const content = await generatePillarContent(category, categoryPlatforms);
      await savePillarContent(content);

      console.log(`\n🎉 Successfully generated pillar page for ${CATEGORIES[category].fullName}`);
      successCount++;

      // Rate limiting: wait 2 seconds between requests
      if (successCount < categoriesWithPlatforms.length) {
        console.log('⏳ Waiting 2 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${category}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Output directory: pillar-content/`);
  console.log('='.repeat(60));
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Pillar Content Generation Script

Usage:
  node scripts/generate-pillar-content.mjs --category <category>
  node scripts/generate-pillar-content.mjs --all
  node scripts/generate-pillar-content.mjs --list

Options:
  --category <cat>   Generate for specific category (e.g., code-ai)
  --all              Generate for all categories
  --list             List available categories
  --help, -h         Show this help

Examples:
  node scripts/generate-pillar-content.mjs --category code-ai
  node scripts/generate-pillar-content.mjs --all
`);
  process.exit(0);
}

if (args.includes('--list')) {
  console.log('\nAvailable Categories:');
  Object.entries(CATEGORIES).forEach(([slug, meta]) => {
    console.log(`  ${slug.padEnd(20)} - ${meta.fullName}`);
  });
  process.exit(0);
}

const categoryIndex = args.indexOf('--category');
if (categoryIndex !== -1 && args[categoryIndex + 1]) {
  const category = args[categoryIndex + 1];
  generateForCategory(category).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (args.includes('--all')) {
  generateAll().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  console.error('❌ Invalid arguments. Use --help for usage information.');
  process.exit(1);
}
