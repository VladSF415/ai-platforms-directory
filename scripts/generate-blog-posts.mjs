#!/usr/bin/env node
/**
 * AI Blog Post Generator
 *
 * Uses DeepSeek to generate high-quality, SEO-optimized blog posts
 * for the AI Platforms List blog.
 *
 * Features:
 * - Industry analysis and trends
 * - Educational content
 * - Platform deep-dives
 * - Comparison articles
 * - SEO-focused tutorials
 *
 * Usage:
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/generate-blog-posts.mjs
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/generate-blog-posts.mjs --count=5
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/generate-blog-posts.mjs --topic="AI writing tools"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  blog_dir: join(__dirname, '../blog-posts'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  count: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 1,
  topic: process.argv.find(arg => arg.startsWith('--topic='))?.split('=')[1] || null
};

// Ensure blog directory exists
if (!existsSync(CONFIG.blog_dir)) {
  mkdirSync(CONFIG.blog_dir, { recursive: true });
}

// Load platforms for reference
let platforms = [];
try {
  platforms = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8'));
} catch (error) {
  console.error('Failed to load platforms:', error);
  process.exit(1);
}

// Blog post topic ideas (rotates through these)
const TOPIC_IDEAS = [
  {
    type: 'industry-analysis',
    title: 'Top AI Trends Shaping 2025',
    keywords: 'AI trends 2025, artificial intelligence future, AI technology trends',
    focus: 'Industry trends and predictions'
  },
  {
    type: 'educational',
    title: 'Complete Guide to AI Writing Tools',
    keywords: 'AI writing tools, AI content generation, best AI writers',
    focus: 'Educational content for beginners'
  },
  {
    type: 'comparison',
    title: 'ChatGPT vs Claude vs Gemini: Which AI is Best?',
    keywords: 'ChatGPT vs Claude, best AI chatbot, AI comparison',
    focus: 'In-depth platform comparisons'
  },
  {
    type: 'tutorial',
    title: 'How to Choose the Right AI Tool for Your Business',
    keywords: 'AI tools for business, choosing AI software, business AI guide',
    focus: 'Practical tutorials and how-tos'
  },
  {
    type: 'category-deep-dive',
    title: 'Best AI Image Generators in 2025',
    keywords: 'AI image generator, best AI art tools, AI image creation',
    focus: 'Category-specific roundups'
  },
  {
    type: 'use-case',
    title: 'AI Tools Every Content Creator Needs',
    keywords: 'AI tools for content creators, content creation AI, creator tools',
    focus: 'Use-case specific recommendations'
  },
  {
    type: 'news-analysis',
    title: 'Breaking Down the Latest AI Announcements',
    keywords: 'AI news, latest AI updates, AI announcements',
    focus: 'Recent news and announcements'
  },
  {
    type: 'productivity',
    title: '10 Ways AI Can Boost Your Productivity',
    keywords: 'AI productivity tools, AI efficiency, productivity AI',
    focus: 'Productivity and efficiency'
  }
];

async function callDeepSeek(prompt, systemPrompt = '') {
  if (!CONFIG.deepseek_api_key) {
    console.error('❌ DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.deepseek_api_key}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateBlogPost(topicIdea) {
  console.log(`\n📝 Generating blog post: "${topicIdea.title}"`);

  const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];
  const randomPlatforms = platforms
    .sort(() => Math.random() - 0.5)
    .slice(0, 10)
    .map(p => `${p.name} - ${p.description}`);

  const systemPrompt = `You are an expert AI technology writer creating high-quality, SEO-optimized blog posts for AI Platforms List, a comprehensive directory of AI tools.

Your writing should be:
- Informative and authoritative
- SEO-optimized with natural keyword usage
- Engaging and reader-friendly
- Well-structured with clear headings
- Include actionable insights
- Reference real platforms from our directory when relevant
- Around 1,500-2,000 words`;

  const prompt = `Write a comprehensive blog post with the following specifications:

TOPIC: ${topicIdea.title}
TYPE: ${topicIdea.type}
FOCUS: ${topicIdea.focus}
TARGET KEYWORDS: ${topicIdea.keywords}

AVAILABLE PLATFORM CATEGORIES: ${categories.join(', ')}

SAMPLE PLATFORMS TO REFERENCE (use naturally, don't force):
${randomPlatforms.join('\n')}

REQUIREMENTS:
1. Create an attention-grabbing introduction
2. Use H2 and H3 headings for structure
3. Include 5-7 main sections
4. Naturally incorporate target keywords (don't stuff)
5. Add internal links to relevant platforms (use markdown: [Platform Name](/platform/slug))
6. Include actionable tips and recommendations
7. Add a strong conclusion with call-to-action
8. Write in a conversational yet professional tone
9. Use bullet points and numbered lists for readability
10. Add a meta description (150-160 characters)

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "SEO-optimized title (60 chars max)",
  "slug": "url-friendly-slug",
  "metaDescription": "Compelling meta description (150-160 chars)",
  "excerpt": "Brief 2-sentence summary",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "blog-category",
  "content": "Full blog post in markdown format",
  "readTime": "estimated read time in minutes"
}

Write the full blog post now:`;

  const response = await callDeepSeek(prompt, systemPrompt);

  // Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON response from DeepSeek');
  }

  const blogPost = JSON.parse(jsonMatch[0]);

  // Add metadata
  blogPost.publishedDate = new Date().toISOString();
  blogPost.author = 'AI Platforms List Team';
  blogPost.featured = false;

  return blogPost;
}

async function main() {
  console.log('🚀 AI Blog Post Generator Started\n');
  console.log(`Generating ${CONFIG.count} blog post(s)...\n`);

  const generatedPosts = [];

  for (let i = 0; i < CONFIG.count; i++) {
    try {
      // Pick a topic (or use custom topic)
      let topicIdea;
      if (CONFIG.topic) {
        topicIdea = {
          type: 'custom',
          title: CONFIG.topic,
          keywords: CONFIG.topic.toLowerCase(),
          focus: 'Custom topic'
        };
      } else {
        topicIdea = TOPIC_IDEAS[Math.floor(Math.random() * TOPIC_IDEAS.length)];
      }

      const blogPost = await generateBlogPost(topicIdea);

      // Save to file
      const filename = `${blogPost.slug}.json`;
      const filepath = join(CONFIG.blog_dir, filename);

      writeFileSync(filepath, JSON.stringify(blogPost, null, 2), 'utf-8');

      console.log(`✅ Generated: ${blogPost.title}`);
      console.log(`   Slug: ${blogPost.slug}`);
      console.log(`   Read time: ${blogPost.readTime}`);
      console.log(`   Saved to: blog-posts/${filename}\n`);

      generatedPosts.push(blogPost);

      // Small delay between posts to avoid rate limits
      if (i < CONFIG.count - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to generate blog post: ${error.message}`);
      if (error.message.includes('insufficient_quota') || error.message.includes('rate_limit')) {
        console.error('💰 Credits exhausted or rate limited. Stopping...');
        break;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 BLOG GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Blog Posts Generated: ${generatedPosts.length}`);
  console.log(`Total Words: ~${generatedPosts.reduce((sum, p) => sum + (p.content?.length || 0) / 5, 0).toFixed(0)}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
