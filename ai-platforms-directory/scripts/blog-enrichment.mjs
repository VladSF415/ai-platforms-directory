#!/usr/bin/env node
/**
 * Blog Post Enrichment Pipeline
 *
 * Enriches existing blog posts with:
 * - Better SEO metadata (title, description, keywords)
 * - More comprehensive content sections
 * - FAQs
 * - Updated statistics and dates
 * - Better formatting and structure
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  blog_dir: join(__dirname, '../blog-posts'),
  platforms_path: join(__dirname, '../platforms.json'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  max_posts: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 10,
  verbose: process.argv.includes('--verbose'),
  dry_run: process.argv.includes('--dry-run'),
};

let platforms = [];
let blogPosts = [];

try {
  platforms = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8'));
  console.log(`📊 Loaded ${platforms.length} platforms\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

if (!CONFIG.deepseek_api_key) {
  console.error('❌ DEEPSEEK_API_KEY not set!');
  process.exit(1);
}

// Load all blog posts
try {
  const files = readdirSync(CONFIG.blog_dir).filter(f => f.endsWith('.json'));
  blogPosts = files.map(file => {
    const data = JSON.parse(readFileSync(join(CONFIG.blog_dir, file), 'utf-8'));
    return { ...data, filename: file };
  });
  console.log(`📝 Loaded ${blogPosts.length} blog posts\n`);
} catch (error) {
  console.error('❌ Failed to load blog posts:', error);
  process.exit(1);
}

async function callDeepSeek(prompt) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.deepseek_api_key}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || response.statusText);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('API error:', error.message);
    return null;
  }
}

// Calculate completeness score
function calculateCompleteness(post) {
  let score = 0;
  let maxScore = 0;

  const checks = [
    { field: 'title', weight: 2 },
    { field: 'excerpt', weight: 2 },
    { field: 'content', weight: 3, minLength: 1000 },
    { field: 'metaDescription', weight: 2 },
    { field: 'keywords', weight: 2, isArray: true, minLength: 5 },
    { field: 'faqs', weight: 2, isArray: true, minLength: 3 },
    { field: 'sections', weight: 2, isArray: true, minLength: 3 },
    { field: 'relatedPlatforms', weight: 1, isArray: true },
    { field: 'readTime', weight: 1 },
    { field: 'author', weight: 1 },
    { field: 'category', weight: 1 },
    { field: 'tags', weight: 1, isArray: true },
  ];

  checks.forEach(check => {
    maxScore += check.weight;

    if (check.isArray) {
      const value = post[check.field];
      if (value && value.length >= (check.minLength || 1)) {
        score += check.weight;
      }
    } else {
      const value = post[check.field];
      if (value) {
        if (check.minLength && typeof value === 'string' && value.length < check.minLength) {
          score += check.weight * 0.5; // Partial credit
        } else {
          score += check.weight;
        }
      }
    }
  });

  return (score / maxScore) * 100;
}

// Enrich blog post
async function enrichBlogPost(post) {
  const currentYear = new Date().getFullYear();
  const completeness = calculateCompleteness(post);

  // Get related platforms if mentioned in post
  const relatedPlatforms = platforms.filter(p => {
    const postText = (post.title + ' ' + post.excerpt + ' ' + (post.content || '')).toLowerCase();
    return postText.includes(p.name.toLowerCase());
  }).slice(0, 10);

  const prompt = `Enrich this blog post with comprehensive, SEO-optimized content:

CURRENT POST:
Title: ${post.title}
Excerpt: ${post.excerpt || 'Missing'}
Content Length: ${post.content?.length || 0} characters
Keywords: ${post.keywords?.join(', ') || 'Missing'}
FAQs: ${post.faqs?.length || 0} questions
Completeness: ${completeness.toFixed(1)}%

RELATED PLATFORMS: ${relatedPlatforms.map(p => p.name).join(', ') || 'None'}

TASK: Enrich this blog post to make it more comprehensive and valuable. Return ONLY valid JSON:

{
  "metaDescription": "SEO-optimized 150-160 char description with keywords",
  "keywords": ["10-12 relevant SEO keywords for ${currentYear}"],
  "tags": ["5-7 content tags"],
  "sections": [
    {
      "heading": "Section title",
      "content": "Rich paragraph content (2-3 paragraphs per section)"
    }
  ],
  "faqs": [
    {
      "question": "Common user question?",
      "answer": "Detailed, helpful answer (2-3 sentences)"
    }
  ],
  "keyTakeaways": ["3-5 bullet points summarizing main insights"],
  "relatedTopics": ["5-7 related topics users might search for"],
  "readTime": estimated_minutes,
  "lastUpdated": "${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}",
  "confidence": 0.0-1.0
}

REQUIREMENTS:
- Focus on ${currentYear} data and trends
- Make FAQs highly specific to the topic
- Sections should expand on existing content, not replace it
- Keywords should include long-tail variants
- Keep factual, avoid speculation
- If current content is good, enhance rather than replace`;

  const response = await callDeepSeek(prompt);
  if (!response) return null;

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    if (CONFIG.verbose) {
      console.error(`  Failed to parse enrichment for ${post.title}`);
    }
  }

  return null;
}

// Main enrichment pipeline
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎨 BLOG POST ENRICHMENT PIPELINE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Calculate completeness for all posts
  const postsWithScores = blogPosts.map(post => ({
    ...post,
    completenessScore: calculateCompleteness(post)
  }));

  // Sort by completeness (enrich least complete first)
  postsWithScores.sort((a, b) => a.completenessScore - b.completenessScore);

  console.log('📊 Blog Post Completeness Scores:\n');
  postsWithScores.slice(0, 15).forEach(post => {
    const bar = '█'.repeat(Math.floor(post.completenessScore / 5));
    console.log(`  ${bar.padEnd(20)} ${post.completenessScore.toFixed(0)}% - ${post.title.substring(0, 60)}`);
  });

  console.log(`\n🎯 Enriching top ${CONFIG.max_posts} posts with lowest completeness...\n`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of postsWithScores.slice(0, CONFIG.max_posts)) {
    console.log(`\n📝 Processing: ${post.title}`);
    console.log(`   Current completeness: ${post.completenessScore.toFixed(1)}%`);

    // Skip if already well-enriched
    if (post.completenessScore >= 85) {
      console.log(`   ✅ Already complete, skipping`);
      skipped++;
      continue;
    }

    const enrichmentData = await enrichBlogPost(post);

    if (!enrichmentData || enrichmentData.confidence < 0.6) {
      console.log(`   ❌ Low confidence enrichment, skipping`);
      failed++;
      continue;
    }

    // Merge enrichment data with existing post
    const enrichedPost = {
      ...post,
      metaDescription: enrichmentData.metaDescription || post.metaDescription,
      keywords: enrichmentData.keywords || post.keywords,
      tags: enrichmentData.tags || post.tags,
      faqs: enrichmentData.faqs || post.faqs,
      keyTakeaways: enrichmentData.keyTakeaways || post.keyTakeaways,
      relatedTopics: enrichmentData.relatedTopics || post.relatedTopics,
      readTime: enrichmentData.readTime || post.readTime,
      lastUpdated: enrichmentData.lastUpdated,
      enriched: true,
      enrichmentDate: new Date().toISOString()
    };

    // Add new sections if provided
    if (enrichmentData.sections && enrichmentData.sections.length > 0) {
      enrichedPost.sections = enrichmentData.sections;
    }

    // Remove temporary fields
    delete enrichedPost.completenessScore;
    delete enrichedPost.filename;

    const newCompleteness = calculateCompleteness(enrichedPost);
    console.log(`   ✅ Enriched: ${post.completenessScore.toFixed(1)}% → ${newCompleteness.toFixed(1)}% (+${(newCompleteness - post.completenessScore).toFixed(1)}%)`);

    if (!CONFIG.dry_run) {
      const filePath = join(CONFIG.blog_dir, post.filename);
      writeFileSync(filePath, JSON.stringify(enrichedPost, null, 2));
      console.log(`   💾 Saved to ${post.filename}`);
    }

    enriched++;

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 ENRICHMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Enriched: ${enriched} posts`);
  console.log(`⏭️  Skipped: ${skipped} posts (already complete)`);
  console.log(`❌ Failed: ${failed} posts`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (CONFIG.dry_run) {
    console.log('💡 DRY RUN: No files were modified. Run without --dry-run to apply changes.\n');
  }
}

main().catch(error => {
  console.error('❌ Pipeline failed:', error);
  process.exit(1);
});
