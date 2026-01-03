#!/usr/bin/env node
/**
 * Blog Post Generator
 *
 * Automatically generates SEO-optimized blog content:
 * - Category guides ("Best X Tools in 2026")
 * - Platform comparisons ("Platform A vs B")
 * - How-to guides
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
  num_posts: parseInt(process.argv.find(arg => arg.startsWith('--num='))?.split('=')[1]) || 3,
  type: process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'category', // category/comparison/guide
  verbose: process.argv.includes('--verbose'),
  dry_run: process.argv.includes('--dry-run'),
};

let platforms = [];

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

// Create blog directory if doesn't exist
if (!existsSync(CONFIG.blog_dir)) {
  mkdirSync(CONFIG.blog_dir, { recursive: true });
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
        temperature: 0.7,
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

// Generate category guide
async function generateCategoryGuide(category) {
  const categoryPlatforms = platforms
    .filter(p => p.category === category && p.name)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    })
    .slice(0, 15);

  if (categoryPlatforms.length < 5) {
    console.log(`  ⚠️  Skipping ${category}: only ${categoryPlatforms.length} platforms`);
    return null;
  }

  const platformList = categoryPlatforms.map(p =>
    `- ${p.name}: ${p.description || 'No description'} (Rating: ${p.rating || 'N/A'})`
  ).join('\n');

  const prompt = `Write a comprehensive, SEO-optimized blog post:

TITLE: "Best ${category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Tools in 2026"

PLATFORMS TO COVER:
${platformList}

REQUIREMENTS:
1. Introduction (150-200 words)
   - What is ${category}?
   - Why it matters in 2026
   - Who needs these tools

2. Top ${Math.min(categoryPlatforms.length, 10)} Platforms (detailed section for each):
   - Platform name & brief overview
   - Key features (3-4 bullet points)
   - Best for (who should use it)
   - Pricing overview
   - Pros and cons

3. How to Choose the Right Tool
   - Key factors to consider
   - Decision framework

4. Conclusion (100 words)
   - Summary
   - Final recommendations
   - Call to action

FORMAT: Markdown with proper headers (##, ###), bullet points, bold text
TONE: Professional, informative, helpful (not salesy)
SEO: Include keywords naturally, use descriptive headers
LENGTH: 2000-2500 words

Write the complete blog post:`;

  const response = await callDeepSeek(prompt);
  return response;
}

// Generate comparison post
async function generateComparison() {
  // Find platforms to compare (same category, similar features, high ratings)
  const categories = [...new Set(platforms.map(p => p.category))];
  const categoryWithMostPlatforms = categories
    .map(cat => ({
      category: cat,
      platforms: platforms.filter(p => p.category === cat && p.rating && parseFloat(p.rating) >= 4.0)
    }))
    .filter(c => c.platforms.length >= 2)
    .sort((a, b) => b.platforms.length - a.platforms.length)[0];

  if (!categoryWithMostPlatforms) {
    console.log('  ⚠️  Not enough platforms for comparison');
    return null;
  }

  const [platform1, platform2] = categoryWithMostPlatforms.platforms
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
    .slice(0, 2);

  const prompt = `Write a detailed comparison blog post:

TITLE: "${platform1.name} vs ${platform2.name}: Which is Better in 2026?"

PLATFORM 1: ${platform1.name}
${platform1.description || ''}
Features: ${platform1.features?.join(', ') || 'N/A'}
Pricing: ${platform1.pricing || 'N/A'}
Rating: ${platform1.rating || 'N/A'}

PLATFORM 2: ${platform2.name}
${platform2.description || ''}
Features: ${platform2.features?.join(', ') || 'N/A'}
Pricing: ${platform2.pricing || 'N/A'}
Rating: ${platform2.rating || 'N/A'}

STRUCTURE:
1. Introduction (what both platforms do, why compare them)
2. Feature Comparison Table (markdown table)
3. Detailed Feature Analysis
4. Pricing Comparison
5. Use Case Scenarios (when to use each)
6. Pros and Cons (for each)
7. Verdict (which is better for different users)
8. Conclusion

FORMAT: Markdown, 1500-2000 words
Include comparison table with ✅ and ❌ symbols`;

  const response = await callDeepSeek(prompt);
  return response;
}

// Main
async function main() {
  console.log('📝 BLOG POST GENERATOR\n');

  const posts = [];

  if (CONFIG.type === 'category') {
    console.log('Generating category guides...\n');

    const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];
    const topCategories = categories
      .map(cat => ({
        category: cat,
        count: platforms.filter(p => p.category === cat).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, CONFIG.num_posts);

    for (let i = 0; i < topCategories.length; i++) {
      const { category } = topCategories[i];
      console.log(`[${i + 1}/${topCategories.length}] Generating guide for: ${category}`);

      const content = await generateCategoryGuide(category);

      if (content) {
        const filename = `best-${category}-tools-2026.md`;
        posts.push({ filename, content, category });
        console.log(`  ✅ Generated: ${filename}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else if (CONFIG.type === 'comparison') {
    console.log('Generating comparison posts...\n');

    for (let i = 0; i < CONFIG.num_posts; i++) {
      console.log(`[${i + 1}/${CONFIG.num_posts}] Generating comparison post`);

      const content = await generateComparison();

      if (content) {
        const filename = `comparison-${i + 1}-${Date.now()}.md`;
        posts.push({ filename, content });
        console.log(`  ✅ Generated: ${filename}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n\n📊 GENERATION SUMMARY\n`);
  console.log(`Posts generated: ${posts.length}`);

  if (!CONFIG.dry_run) {
    posts.forEach(post => {
      const filepath = join(CONFIG.blog_dir, post.filename);
      writeFileSync(filepath, post.content);
    });

    console.log(`\n✅ Saved ${posts.length} blog posts to ${CONFIG.blog_dir}`);

    // Generate index
    let index = '# Generated Blog Posts\n\n';
    index += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    posts.forEach(post => {
      index += `- [${post.filename}](${post.filename})\n`;
    });
    writeFileSync(join(CONFIG.blog_dir, 'INDEX.md'), index);
  }

  console.log('\n🎉 Blog generation complete!');
}

main().catch(console.error);
