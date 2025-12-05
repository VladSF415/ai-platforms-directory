#!/usr/bin/env node
/**
 * AI-Powered Platform Organizer
 *
 * Uses Claude/GPT to:
 * - Discover new AI platforms from the web
 * - Automatically categorize and add them
 * - Enrich existing platform data
 * - Fix duplicates and data issues
 * - Keep the directory up-to-date
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  anthropic_api_key: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
  openai_api_key: process.env.OPENAI_API_KEY,
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  mode: process.argv.includes('--discover') ? 'discover' :
        process.argv.includes('--enrich') ? 'enrich' :
        process.argv.includes('--fix-all') ? 'fix-all' : 'analyze',
  auto_add: process.argv.includes('--auto-add'),
  max_new_platforms: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 10,
  verbose: process.argv.includes('--verbose'),
  dry_run: process.argv.includes('--dry-run'),
  provider: process.argv.find(arg => arg.startsWith('--provider='))?.split('=')[1] || 'auto'
};

// Sources for discovering new platforms
const DISCOVERY_SOURCES = [
  'Product Hunt AI category',
  'GitHub trending AI repositories',
  'Papers with Code',
  'Hugging Face Spaces',
  'AI news sites (TechCrunch, VentureBeat)',
  'Reddit r/artificial, r/MachineLearning',
  'Twitter AI influencers',
  'AI directories and marketplaces'
];

let platforms = [];

// Load platforms
try {
  const data = readFileSync(CONFIG.platforms_path, 'utf-8');
  platforms = JSON.parse(data);
  console.log(`📊 Loaded ${platforms.length} existing platforms\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

// Check API keys
function checkAPIKeys() {
  if (!CONFIG.anthropic_api_key && !CONFIG.openai_api_key && !CONFIG.deepseek_api_key) {
    console.error('❌ No AI API key found!');
    console.error('\nSet one of these environment variables:');
    console.error('  export ANTHROPIC_API_KEY="sk-ant-..."  # For Claude');
    console.error('  export OPENAI_API_KEY="sk-..."         # For GPT');
    console.error('  export DEEPSEEK_API_KEY="sk-..."       # For DeepSeek (cheapest!)');
    console.error('\nOr add to .env file\n');
    process.exit(1);
  }

  let provider;
  if (CONFIG.provider === 'deepseek' && CONFIG.deepseek_api_key) {
    provider = 'DeepSeek';
  } else if (CONFIG.provider === 'claude' && CONFIG.anthropic_api_key) {
    provider = 'Claude (Anthropic)';
  } else if (CONFIG.provider === 'gpt' && CONFIG.openai_api_key) {
    provider = 'GPT (OpenAI)';
  } else {
    // Auto-select based on available keys (prefer DeepSeek for cost)
    if (CONFIG.deepseek_api_key) provider = 'DeepSeek';
    else if (CONFIG.anthropic_api_key) provider = 'Claude (Anthropic)';
    else provider = 'GPT (OpenAI)';
  }

  console.log(`🤖 Using ${provider} for AI intelligence\n`);
}

// Call Claude API
async function callClaude(prompt, system = '') {
  if (!CONFIG.anthropic_api_key) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.anthropic_api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: system || 'You are an expert AI platforms researcher and data curator.',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    return null;
  }
}

// Call OpenAI API
async function callOpenAI(prompt, system = '') {
  if (!CONFIG.openai_api_key) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openai_api_key}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: system || 'You are an expert AI platforms researcher and data curator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    return null;
  }
}

// Call DeepSeek API
async function callDeepSeek(prompt, system = '') {
  if (!CONFIG.deepseek_api_key) return null;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.deepseek_api_key}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system || 'You are an expert AI platforms researcher and data curator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ DeepSeek API error:', error.message);
    return null;
  }
}

// Universal AI caller
async function callAI(prompt, system = '') {
  // Use specified provider or auto-select
  if (CONFIG.provider === 'deepseek' || (!CONFIG.provider || CONFIG.provider === 'auto') && CONFIG.deepseek_api_key) {
    return await callDeepSeek(prompt, system);
  } else if (CONFIG.provider === 'claude' || (!CONFIG.provider || CONFIG.provider === 'auto') && CONFIG.anthropic_api_key) {
    return await callClaude(prompt, system);
  } else {
    return await callOpenAI(prompt, system);
  }
}

// 1. DISCOVER NEW PLATFORMS
async function discoverNewPlatforms() {
  console.log('🔍 Discovering new AI platforms...\n');

  const existingNames = platforms.map(p => p.name.toLowerCase());

  const prompt = `You are researching the latest AI platforms and tools launched in 2024-2025.

EXISTING PLATFORMS (${platforms.length} total):
${existingNames.slice(0, 50).join(', ')}... (and ${existingNames.length - 50} more)

TASK: Discover ${CONFIG.max_new_platforms} NEW AI platforms that are:
1. NOT in the existing list above
2. Launched or gained popularity in 2024-2025
3. Actively maintained and popular
4. Have a working website/product

For each platform, provide:
- name: Official name
- description: Clear 1-2 sentence description
- url: Official website
- category: One of (ml-frameworks, generative-ai, computer-vision, nlp, llms, image-generation, analytics-bi, code-ai)
- tags: 3-5 relevant tags
- pricing: (free, freemium, paid, open-source)
- reasoning: Why this platform should be included

Return ONLY valid JSON array:
[
  {
    "name": "Example AI",
    "description": "...",
    "url": "https://...",
    "category": "...",
    "tags": ["tag1", "tag2"],
    "pricing": "...",
    "reasoning": "..."
  }
]`;

  const response = await callAI(prompt);
  if (!response) return [];

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const newPlatforms = JSON.parse(jsonText);

    console.log(`✨ Discovered ${newPlatforms.length} new platforms:\n`);
    newPlatforms.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.category})`);
      console.log(`     ${p.description}`);
      console.log(`     URL: ${p.url}`);
      if (CONFIG.verbose) {
        console.log(`     Reasoning: ${p.reasoning}`);
      }
      console.log();
    });

    return newPlatforms;

  } catch (error) {
    console.error('❌ Failed to parse AI response:', error.message);
    if (CONFIG.verbose) {
      console.log('\nRaw response:', response);
    }
    return [];
  }
}

// 2. ENRICH PLATFORM DATA
async function enrichPlatform(platform) {
  const prompt = `Analyze this AI platform and enrich its data:

NAME: ${platform.name}
CURRENT DESCRIPTION: ${platform.description || 'N/A'}
URL: ${platform.url || platform.website || 'N/A'}
CURRENT CATEGORY: ${platform.category || 'N/A'}
CURRENT TAGS: ${(platform.tags || []).join(', ') || 'N/A'}

TASK: Provide enriched data in JSON format:
{
  "description": "Improved 1-2 sentence description (clear, concise, professional)",
  "category": "Best category from: ml-frameworks, generative-ai, computer-vision, nlp, llms, image-generation, analytics-bi, code-ai",
  "tags": ["5-8 relevant tags"],
  "features": ["3-5 key features"],
  "pricing": "free/freemium/paid/open-source",
  "use_cases": ["3-5 use cases"],
  "confidence": 0.0-1.0
}`;

  const response = await callAI(prompt);
  if (!response) return null;

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    if (CONFIG.verbose) {
      console.error(`  ⚠️  Failed to enrich ${platform.name}:`, error.message);
    }
  }

  return null;
}

// 3. INTELLIGENT DUPLICATE DETECTION
async function detectIntelligentDuplicates(platforms) {
  console.log('🔍 Using AI to detect intelligent duplicates...\n');

  // Group similar platforms
  const groups = [];
  const processed = new Set();

  for (let i = 0; i < platforms.length && groups.length < 10; i++) {
    if (processed.has(i)) continue;

    const platform1 = platforms[i];
    const similar = [platform1];

    for (let j = i + 1; j < platforms.length; j++) {
      if (processed.has(j)) continue;

      const platform2 = platforms[j];

      // Quick similarity check
      const name1 = platform1.name.toLowerCase();
      const name2 = platform2.name.toLowerCase();

      if (name1.includes(name2) || name2.includes(name1) ||
          (platform1.url && platform2.url && platform1.url.includes(platform2.url.split('/')[2]))) {
        similar.push(platform2);
        processed.add(j);
      }
    }

    if (similar.length > 1) {
      groups.push(similar);
      processed.add(i);
    }
  }

  if (groups.length === 0) {
    console.log('✅ No obvious duplicates found\n');
    return [];
  }

  console.log(`Found ${groups.length} potential duplicate groups. Analyzing with AI...\n`);

  const decisions = [];

  for (const group of groups.slice(0, 5)) { // Limit to avoid API costs
    const prompt = `Analyze these potentially duplicate AI platforms:

${group.map((p, i) => `
PLATFORM ${i + 1}:
- ID: ${p.id}
- Name: ${p.name}
- Description: ${p.description || 'N/A'}
- URL: ${p.url || p.website || 'N/A'}
- Tags: ${(p.tags || []).join(', ')}
`).join('\n')}

TASK: Determine if these are duplicates and provide a decision:
{
  "are_duplicates": true/false,
  "reasoning": "Why they are or aren't duplicates",
  "action": "keep_all/keep_first/keep_best/merge",
  "keep_id": "ID to keep if merging",
  "merged_data": {
    "name": "Best name",
    "description": "Best description",
    "tags": ["merged tags"],
    "features": ["merged features"]
  }
}`;

    const response = await callAI(prompt);
    if (!response) continue;

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        decision.group = group;
        decisions.push(decision);

        console.log(`  Group: ${group.map(p => p.name).join(' / ')}`);
        console.log(`  Decision: ${decision.action}`);
        console.log(`  Reasoning: ${decision.reasoning}\n`);
      }
    } catch (error) {
      if (CONFIG.verbose) {
        console.error('  Failed to parse decision:', error.message);
      }
    }
  }

  return decisions;
}

// 4. AUTO-FIX WITH AI
async function autoFixWithAI() {
  console.log('🔧 AI-powered auto-fix...\n');

  let fixed = 0;

  // Fix platforms with poor descriptions
  const needsEnrichment = platforms
    .filter(p => !p.description || p.description.length < 30)
    .slice(0, 10); // Limit to avoid costs

  console.log(`Found ${needsEnrichment.length} platforms needing enrichment\n`);

  for (const platform of needsEnrichment) {
    console.log(`  Enriching: ${platform.name}...`);

    const enriched = await enrichPlatform(platform);
    if (enriched && enriched.confidence > 0.7) {
      platform.description = enriched.description;
      platform.category = enriched.category;
      platform.tags = enriched.tags;
      platform.features = enriched.features || platform.features;
      platform.pricing = enriched.pricing || platform.pricing;

      fixed++;
      console.log(`    ✅ Enhanced`);
    } else {
      console.log(`    ⚠️  Low confidence, skipped`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Fixed ${fixed} platforms\n`);
  return fixed;
}

// MAIN EXECUTION
async function main() {
  console.log('🤖 AI-Powered Platform Organizer\n');
  console.log('='.repeat(50) + '\n');

  checkAPIKeys();

  let newPlatforms = [];
  let enriched = 0;
  let duplicateDecisions = [];

  if (CONFIG.mode === 'discover') {
    console.log('MODE: Discover new platforms\n');
    newPlatforms = await discoverNewPlatforms();

    if (newPlatforms.length > 0 && CONFIG.auto_add) {
      console.log('➕ Adding new platforms to directory...\n');

      newPlatforms.forEach(np => {
        const platform = {
          id: np.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: np.name,
          description: np.description,
          url: np.url,
          website: np.url,
          category: np.category,
          tags: np.tags || [],
          pricing: np.pricing || 'unknown',
          featured: false,
          verified: false,
          added_by: 'ai-auto-discovery',
          added_date: new Date().toISOString()
        };

        platforms.push(platform);
        console.log(`  ✅ Added: ${platform.name}`);
      });

      console.log();
    }

  } else if (CONFIG.mode === 'enrich') {
    console.log('MODE: Enrich existing platforms\n');
    enriched = await autoFixWithAI();

  } else if (CONFIG.mode === 'fix-all') {
    console.log('MODE: Comprehensive AI fix\n');

    // Enrich
    enriched = await autoFixWithAI();

    // Detect duplicates
    duplicateDecisions = await detectIntelligentDuplicates(platforms);

  } else {
    console.log('MODE: Analyze only (no changes)\n');

    console.log('Available modes:');
    console.log('  --discover    Discover and add new platforms');
    console.log('  --enrich      Enrich existing platform data');
    console.log('  --fix-all     Comprehensive fix (enrich + duplicates)');
    console.log('\nFlags:');
    console.log('  --auto-add    Automatically add discovered platforms');
    console.log('  --max=N       Max new platforms to discover (default: 10)');
    console.log('  --verbose     Show detailed output');
    console.log('  --dry-run     Don\'t save changes\n');
    return;
  }

  // Save if changes were made
  if (!CONFIG.dry_run && (newPlatforms.length > 0 || enriched > 0)) {
    console.log('💾 Saving changes to platforms.json...\n');
    writeFileSync(
      CONFIG.platforms_path,
      JSON.stringify(platforms, null, 2),
      'utf-8'
    );
    console.log('✅ Saved!\n');
  } else if (CONFIG.dry_run) {
    console.log('🔍 Dry run - no changes saved\n');
  }

  // Summary
  console.log('='.repeat(50));
  console.log('\n📈 SUMMARY:\n');
  console.log(`  Total Platforms: ${platforms.length}`);
  if (newPlatforms.length > 0) {
    console.log(`  ✨ New Platforms Discovered: ${newPlatforms.length}`);
  }
  if (enriched > 0) {
    console.log(`  ✅ Platforms Enriched: ${enriched}`);
  }
  if (duplicateDecisions.length > 0) {
    console.log(`  🔍 Duplicate Groups Analyzed: ${duplicateDecisions.length}`);
  }
  console.log();

  if (!CONFIG.auto_add && newPlatforms.length > 0) {
    console.log('💡 Run with --auto-add to automatically add discovered platforms\n');
  }
}

main().catch(console.error);
