#!/usr/bin/env node

/**
 * Landing Page Content Generation Script
 * Generates SEO-optimized landing pages for target keywords using DeepSeek AI
 *
 * Usage:
 *   node scripts/generate-landing-pages.mjs --all
 *   node scripts/generate-landing-pages.mjs --page how-to-choose-ai-platforms
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

// Landing page configurations for all 5 pages
const LANDING_PAGES = {
  'how-to-choose-ai-platforms': {
    title: 'How to Choose the Right AI Platform in 2025: Complete Buyer\'s Guide',
    h1: 'How to Choose the Right AI Platform in 2025',
    subtitle: 'Expert framework for evaluating and selecting AI platforms that match your business needs, technical requirements, and budget',
    metaDescription: 'Complete guide to choosing AI platforms in 2025. Compare features, pricing, and use cases across 1,000+ tools. Free platform selector quiz included.',
    targetKeywords: ['how to choose ai platforms', 'ai platform selection guide', 'choosing ai tools', 'ai platform comparison'],
    primaryKeyword: 'how to choose ai platforms',
    category: 'cross-category',
    stats: [
      { label: 'Platforms Analyzed', value: '1,039+' },
      { label: 'Selection Criteria', value: '12' },
      { label: 'Decision Framework Steps', value: '7' }
    ],
    interactiveFeatureType: 'quiz',
    platformCount: 20, // top platforms across all categories
    relatedPlatforms: [] // Will be populated with top-rated platforms
  },
  'machine-learning-tools-directory': {
    title: 'Machine Learning Tools Directory 2025: Complete ML Platform Catalog',
    h1: 'Complete Machine Learning Tools Directory 2025',
    subtitle: 'Comprehensive directory of ML frameworks, AutoML platforms, MLOps tools, and model deployment solutions for data scientists and ML engineers',
    metaDescription: 'Explore 50+ machine learning tools and platforms. Compare TensorFlow, PyTorch, AutoML solutions, and MLOps platforms. Updated 2025.',
    targetKeywords: ['machine learning tools directory', 'ml tools list', 'ml platform directory', 'machine learning software'],
    primaryKeyword: 'machine learning tools directory',
    category: 'ml-frameworks',
    additionalCategories: ['llm-ops', 'data-governance'],
    stats: [
      { label: 'ML Platforms', value: '50+' },
      { label: 'Categories', value: '5' },
      { label: 'Open Source Tools', value: '30+' }
    ],
    interactiveFeatureType: 'comparison',
    platformCount: 50
  },
  'natural-language-processing-tools': {
    title: 'Best Natural Language Processing Tools & Platforms 2025',
    h1: 'Best Natural Language Processing Tools & Platforms',
    subtitle: 'Discover leading NLP tools for text analysis, sentiment detection, named entity recognition, and language understanding in 2025',
    metaDescription: 'Top NLP tools and platforms for text analytics, sentiment analysis, and language understanding. Compare 65+ NLP solutions. Expert reviews.',
    targetKeywords: ['natural language processing tools', 'nlp tools', 'nlp platforms', 'text analytics tools'],
    primaryKeyword: 'natural language processing tools',
    category: 'nlp',
    stats: [
      { label: 'NLP Platforms', value: '65+' },
      { label: 'Use Cases Covered', value: '15+' },
      { label: 'Languages Supported', value: '100+' }
    ],
    interactiveFeatureType: 'matcher',
    platformCount: 65
  },
  'computer-vision-platforms': {
    title: 'Leading Computer Vision Platforms & Solutions 2025',
    h1: 'Leading Computer Vision Platforms & Solutions 2025',
    subtitle: 'Comprehensive guide to computer vision platforms for object detection, image recognition, OCR, and visual AI applications',
    metaDescription: 'Compare top computer vision platforms. Object detection, facial recognition, OCR solutions. ROI calculator included. 100+ platforms reviewed.',
    targetKeywords: ['computer vision platforms', 'computer vision tools', 'image recognition platforms', 'cv solutions'],
    primaryKeyword: 'computer vision platforms',
    category: 'computer-vision',
    stats: [
      { label: 'CV Platforms', value: '105+' },
      { label: 'Industry Applications', value: '12' },
      { label: 'Accuracy Range', value: '85-99%' }
    ],
    interactiveFeatureType: 'calculator',
    platformCount: 105
  },
  'enterprise-ai-solutions': {
    title: 'Enterprise AI Solutions: Complete Buyer\'s Guide 2025',
    h1: 'Enterprise AI Solutions: Complete Buyer\'s Guide 2025',
    subtitle: 'Navigate enterprise AI adoption with our comprehensive guide to platforms offering scalability, security, compliance, and ROI for large organizations',
    metaDescription: 'Enterprise AI solutions guide: security, scalability, compliance. Compare 60+ platforms for Fortune 500. Readiness assessment included.',
    targetKeywords: ['enterprise ai solutions', 'enterprise ai platforms', 'business ai software', 'ai for enterprises'],
    primaryKeyword: 'enterprise ai solutions',
    category: 'enterprise-ai-platforms',
    additionalCategories: ['llm-ops', 'data-governance'],
    stats: [
      { label: 'Enterprise Platforms', value: '61+' },
      { label: 'Fortune 500 Users', value: '85%' },
      { label: 'Security Certifications', value: 'SOC 2, HIPAA, ISO' }
    ],
    interactiveFeatureType: 'assessment',
    platformCount: 61
  }
};

/**
 * Call DeepSeek API to generate content
 */
async function generateWithAI(prompt) {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    throw error;
  }
}

/**
 * Generate landing page content
 */
async function generateLandingPage(pageSlug, config) {
  console.log(`\n🤖 Generating content for: ${config.title}`);
  console.log(`   Target keyword: ${config.primaryKeyword}`);
  console.log(`   Word count target: 3,500-4,500 words\n`);

  const prompt = `You are an expert SEO content writer and AI platforms analyst. Generate a comprehensive landing page for "${config.title}".

**PRIMARY KEYWORD**: ${config.primaryKeyword}
**SECONDARY KEYWORDS**: ${config.targetKeywords.join(', ')}
**TARGET AUDIENCE**: Business decision-makers, developers, data scientists, technical leaders
**WORD COUNT**: 3,500-4,500 words
**TONE**: Expert, authoritative, helpful, data-driven

**CRITICAL SEO REQUIREMENTS**:
1. Use primary keyword "${config.primaryKeyword}" in:
   - H1 (already set: "${config.h1}")
   - First paragraph (within first 100 words)
   - At least 3 H2 subheadings
   - Meta description
   - Naturally throughout content (0.8-1.2% density)

2. E-E-A-T Compliance:
   - Include specific data points and statistics
   - Reference testing methodology
   - Cite platform capabilities from 2025
   - Show expertise through detailed analysis

3. Content Structure:
   - Introduction (300-400 words): Context, importance, what readers will learn
   - 5-7 main sections with H2 headings
   - Each section: 400-600 words
   - Include subsections with H3 headings
   - Use bullet points and numbered lists

4. SEO Best Practices:
   - Write for featured snippets (use lists, tables, Q&A format)
   - Include LSI keywords naturally
   - Use transition words
   - Keep paragraphs under 150 words

**REQUIRED SECTIONS**:

1. **Introduction** (300-400 words)
   - Hook: Why this topic matters in 2025
   - Problem statement
   - What readers will learn
   - Include primary keyword in first paragraph

2. **Understanding [Topic]** (500-600 words)
   - Define key concepts
   - Current landscape in 2025
   - Market trends and adoption rates
   - Business value and ROI potential

3. **Key Selection Criteria** (600-700 words)
   - List 7-10 evaluation criteria
   - Explain each criterion
   - How to assess platforms
   - Common pitfalls to avoid

4. **Platform Categories & Types** (500-600 words)
   - Different types of solutions
   - When to use each type
   - Pros and cons
   - Best fit scenarios

5. **Use Cases & Applications** (500-600 words)
   - 5-7 detailed use cases
   - Industry-specific applications
   - Real-world examples
   - Success metrics

6. **Implementation Considerations** (400-500 words)
   - Technical requirements
   - Integration considerations
   - Team skills needed
   - Timeline expectations

7. **Cost & ROI Analysis** (400-500 words)
   - Pricing models explained
   - Total cost of ownership
   - ROI calculation approach
   - Budget recommendations

8. **10 FAQs** (800-1000 words total)
   - Each question: 80-100 words answer
   - Target long-tail keywords
   - Structured for featured snippets
   - Practical, actionable answers

**OUTPUT FORMAT**: Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "introduction": "Full introduction text...",
  "sections": [
    {
      "id": "understanding-topic",
      "title": "Understanding [Topic]",
      "content": ["paragraph1", "paragraph2", "paragraph3"],
      "subsections": [
        {
          "title": "Subsection Title",
          "content": ["paragraph1", "paragraph2"]
        }
      ]
    }
  ],
  "faqs": [
    {
      "question": "Question text?",
      "answer": "Detailed answer..."
    }
  ]
}

**IMPORTANT**:
- Be specific, not generic
- Use data and statistics (with realistic 2025 numbers)
- Maintain expert tone throughout
- Optimize for ${config.primaryKeyword}
- Make content actionable and valuable
- Focus on helping readers make informed decisions

Generate the content now:`;

  const generatedContent = await generateWithAI(prompt);

  // Parse JSON response
  let parsedContent;
  try {
    // Try to extract JSON if wrapped in markdown code blocks
    const jsonMatch = generatedContent.match(/```json?\s*([\s\S]*?)\s*```/) ||
                      generatedContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedContent;
    parsedContent = JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Failed to parse AI response as JSON');
    throw new Error('AI did not return valid JSON');
  }

  // Construct full landing page object
  const landingPage = {
    slug: pageSlug,
    pageType: 'landing',
    title: config.title,
    metaDescription: config.metaDescription,
    targetKeywords: config.targetKeywords,
    hero: {
      h1: config.h1,
      subtitle: config.subtitle,
      stats: config.stats,
      cta: {
        text: config.interactiveFeatureType === 'quiz' ? 'Take the Quiz' :
              config.interactiveFeatureType === 'calculator' ? 'Calculate ROI' :
              config.interactiveFeatureType === 'comparison' ? 'Compare Platforms' :
              config.interactiveFeatureType === 'matcher' ? 'Find Your Match' :
              'Get Started',
        link: `#${config.interactiveFeatureType}`
      }
    },
    introduction: parsedContent.introduction,
    sections: parsedContent.sections,
    interactiveFeature: {
      type: config.interactiveFeatureType,
      config: {}
    },
    featuredPlatforms: config.relatedPlatforms || [],
    faqs: parsedContent.faqs,
    relatedResources: generateRelatedResources(pageSlug),
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  return landingPage;
}

/**
 * Generate related resources links
 */
function generateRelatedResources(currentSlug) {
  const allPages = Object.keys(LANDING_PAGES);
  const related = allPages
    .filter(slug => slug !== currentSlug)
    .slice(0, 3)
    .map(slug => ({
      title: LANDING_PAGES[slug].title,
      url: `/${slug}`
    }));

  return related;
}

/**
 * Save landing page to JSON file
 */
function saveLandingPage(pageSlug, content) {
  const landingDir = path.join(__dirname, '..', 'landing-content');

  // Create directory if it doesn't exist
  if (!fs.existsSync(landingDir)) {
    fs.mkdirSync(landingDir, { recursive: true });
  }

  const filePath = path.join(landingDir, `${pageSlug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

  console.log(`✅ Saved: ${filePath}`);
  console.log(`   Word count: ~${estimateWordCount(content)} words\n`);
}

/**
 * Estimate word count from content object
 */
function estimateWordCount(content) {
  let wordCount = 0;

  // Introduction
  if (content.introduction) {
    wordCount += content.introduction.split(/\s+/).length;
  }

  // Sections
  if (content.sections) {
    content.sections.forEach(section => {
      section.content.forEach(paragraph => {
        wordCount += paragraph.split(/\s+/).length;
      });

      if (section.subsections) {
        section.subsections.forEach(sub => {
          sub.content.forEach(paragraph => {
            wordCount += paragraph.split(/\s+/).length;
          });
        });
      }
    });
  }

  // FAQs
  if (content.faqs) {
    content.faqs.forEach(faq => {
      wordCount += faq.question.split(/\s+/).length;
      wordCount += faq.answer.split(/\s+/).length;
    });
  }

  return wordCount;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const generateAll = args.includes('--all');
  const specificPage = args.find(arg => arg.startsWith('--page='))?.split('=')[1];

  console.log('🚀 Landing Page Content Generator\n');
  console.log('   Using: DeepSeek AI');
  console.log('   Target: SEO-optimized landing pages\n');

  let pagesToGenerate = [];

  if (generateAll) {
    pagesToGenerate = Object.keys(LANDING_PAGES);
    console.log(`📝 Generating all ${pagesToGenerate.length} landing pages\n`);
  } else if (specificPage) {
    if (LANDING_PAGES[specificPage]) {
      pagesToGenerate = [specificPage];
      console.log(`📝 Generating: ${specificPage}\n`);
    } else {
      console.error(`❌ Unknown page: ${specificPage}`);
      console.log(`Available pages: ${Object.keys(LANDING_PAGES).join(', ')}`);
      process.exit(1);
    }
  } else {
    console.log('Usage:');
    console.log('  --all                          Generate all landing pages');
    console.log('  --page=how-to-choose-ai-platforms  Generate specific page\n');
    console.log('Available pages:');
    Object.keys(LANDING_PAGES).forEach(slug => {
      console.log(`  - ${slug}`);
    });
    process.exit(0);
  }

  // Generate each page
  for (const pageSlug of pagesToGenerate) {
    try {
      const config = LANDING_PAGES[pageSlug];
      const content = await generateLandingPage(pageSlug, config);
      saveLandingPage(pageSlug, content);

      // Wait 2 seconds between API calls to avoid rate limiting
      if (pagesToGenerate.indexOf(pageSlug) < pagesToGenerate.length - 1) {
        console.log('⏳ Waiting 2 seconds before next generation...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${pageSlug}:`, error.message);
    }
  }

  console.log('\n✨ Content generation complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
