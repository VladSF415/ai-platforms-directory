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
  affiliate_opportunities_path: join(__dirname, '../affiliate-opportunities.md'),
  anthropic_api_key: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
  openai_api_key: process.env.OPENAI_API_KEY,
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  mode: process.argv.includes('--discover') ? 'discover' :
        process.argv.includes('--enrich') ? 'enrich' :
        process.argv.includes('--recategorize') ? 'recategorize' :
        process.argv.includes('--fix-all') ? 'fix-all' : 'analyze',
  auto_add: process.argv.includes('--auto-add'),
  max_new_platforms: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 10,
  max_recategorize: parseInt(process.argv.find(arg => arg.startsWith('--recat-max='))?.split('=')[1]) || 30,
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
let affiliateOpportunities = [];

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
        max_tokens: 8000  // Increased for complete platform JSON responses
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

  const existingNames = platforms
    .filter(p => p.name)
    .map(p => p.name.toLowerCase());

  // Get existing categories
  const existingCategories = [...new Set(platforms.map(p => p.category).filter(Boolean))].sort();

  const prompt = `You are researching the latest AI platforms and tools launched in 2024-2026.

EXISTING PLATFORMS (${platforms.length} total):
${existingNames.slice(0, 100).join(', ')}${existingNames.length > 100 ? `... (and ${existingNames.length - 100} more)` : ''}

EXISTING CATEGORIES:
${existingCategories.join(', ')}

CRITICAL: DO NOT add any platform already in the existing list above! Check carefully for duplicates, variations, or similar names.

TASK: Discover ${CONFIG.max_new_platforms} COMPLETELY NEW AI platforms that are:
1. ❌ NOT in the existing list above (no duplicates, no variations!)
2. ✅ Launched or gained significant popularity in 2024-2026
3. ✅ Actively maintained with real users
4. ✅ Have a working website/product (no vaporware)
5. 💰 **PRIORITIZE platforms with active affiliate/referral programs** (highest priority!)

MONETIZATION PRIORITY:
- Look for platforms with "Partner Program", "Affiliate Program", or "Referral Program"
- SaaS/paid platforms are more likely to have affiliate programs
- Popular platforms with high revenue potential
- Platforms mentioned on affiliate networks (Impact, PartnerStack, ShareASale, Commission Junction)
- Enterprise platforms with high-ticket sales

CATEGORIZATION:
- Use existing categories when appropriate: ${existingCategories.join(', ')}
- Create NEW categories for emerging AI types (e.g., audio-ai, video-ai, robotics-ai, agent-platforms, search-ai, workflow-automation, document-ai, etc.)
- Category names should be lowercase with hyphens
- Choose the MOST SPECIFIC category that fits

For each platform, provide:
- name: Official name (must be unique, not in existing list!)
- description: Rich 2-3 sentence description covering what it does, key features, and target users
- url: Official website (must be valid and working)
- category: Best fit from existing OR new category (lowercase-with-hyphens)
- tags: 5-8 relevant, specific tags
- pricing: (free, freemium, paid, open-source, enterprise)
- features: Array of 3-5 key features
- use_cases: Array of 3-5 practical use cases
- has_affiliate: true/false (does it have an affiliate/referral program?)
- affiliate_info: Detailed affiliate program info (commission %, network, program URL, requirements)
- reasoning: Why this platform should be included (mention monetization potential and uniqueness)

Return ONLY valid JSON array:
[
  {
    "name": "Example AI",
    "description": "Comprehensive AI platform that revolutionizes content creation for marketing teams with automated workflows, brand consistency, and multi-channel distribution.",
    "url": "https://example-ai.com",
    "category": "marketing-ai",
    "tags": ["content-creation", "marketing-automation", "brand-management", "multi-channel", "saas"],
    "pricing": "freemium",
    "features": ["AI content generation", "Brand voice consistency", "Multi-platform publishing", "Analytics dashboard", "Team collaboration"],
    "use_cases": ["Marketing campaign creation", "Social media management", "Blog post generation", "Email marketing", "Brand guidelines enforcement"],
    "has_affiliate": true,
    "affiliate_info": "30% recurring commission via Impact.com, 90-day cookie, minimum $100 payout, requires approved application",
    "reasoning": "Fast-growing SaaS with $50M ARR, active partner program on Impact.com, high customer lifetime value ($2000+ avg), targets enterprises with budget"
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

    // PRE-CHECK: Filter out any duplicates before adding
    const filteredPlatforms = [];
    for (const newPlatform of newPlatforms) {
      let isDuplicate = false;

      // Check against ALL existing platforms with fuzzy matching AND URL-based detection
      for (const existing of platforms) {
        if (!existing.name) continue;

        const similarity = calculateSimilarity(newPlatform.name, existing.name);

        // Enhanced URL-based duplicate detection
        const newDomain = extractDomain(newPlatform.url);
        const existingDomain = extractDomain(existing.url || existing.website);
        const urlMatch = newDomain && existingDomain && newDomain === existingDomain;

        if (similarity >= 0.75) {
          isDuplicate = true;
          console.log(`  ⚠️  DUPLICATE DETECTED (Name): "${newPlatform.name}" matches "${existing.name}" (${(similarity * 100).toFixed(0)}% similar)`);
          break;
        }

        if (urlMatch) {
          isDuplicate = true;
          console.log(`  ⚠️  DUPLICATE DETECTED (URL): "${newPlatform.name}" has same domain as "${existing.name}" (${newDomain})`);
          break;
        }
      }

      if (!isDuplicate) {
        filteredPlatforms.push(newPlatform);
      }
    }

    console.log(`\n📊 Duplicate check: ${newPlatforms.length} discovered → ${filteredPlatforms.length} unique\n`);

    filteredPlatforms.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.category})`);
      console.log(`     ${p.description}`);
      console.log(`     URL: ${p.url}`);
      if (CONFIG.verbose) {
        console.log(`     Reasoning: ${p.reasoning}`);
      }
      console.log();
    });

    return filteredPlatforms;

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
  const existingCategories = [...new Set(platforms.map(p => p.category).filter(Boolean))].sort();

  const prompt = `Research and enrich this AI platform with comprehensive, accurate information:

PLATFORM: ${platform.name}
CURRENT DESCRIPTION: ${platform.description || 'N/A'}
WEBSITE: ${platform.url || platform.website || 'N/A'}
CURRENT CATEGORY: ${platform.category || 'N/A'}
CURRENT TAGS: ${(platform.tags || []).join(', ') || 'N/A'}
CURRENT FEATURES: ${(platform.features || []).join(', ') || 'N/A'}

TASK: Research this platform and provide enriched, detailed, and accurate data:

{
  "description": "Rich 2-3 sentence description covering: what it does, key capabilities, target audience, and what makes it unique",
  "category": "Best fit from existing [${existingCategories.join(', ')}] OR create new specific category (lowercase-with-hyphens)",
  "tags": ["5-8 specific, searchable tags"],
  "features": ["5-8 concrete features with specifics (not vague)"],
  "use_cases": ["4-6 real-world use cases"],
  "pricing": "free/freemium/paid/open-source/enterprise",
  "pricing_details": {
    "model": "subscription/one-time/usage-based/free/open-source",
    "tiers": ["Free: details", "Pro: $XX/mo - details", "Enterprise: Custom - details"],
    "free_tier": "Yes/No - what's included",
    "starting_price": "$XX/month or Free"
  },
  "target_audience": ["primary audience 1", "primary audience 2", "primary audience 3"],
  "has_api": true/false,
  "has_affiliate": true/false,
  "confidence": 0.0-1.0 (how confident you are in this data)
}

IMPORTANT:
- Be specific and accurate
- Include real pricing if known
- Don't guess - if unsure, use null or lower confidence
- Focus on facts, not marketing fluff`;

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

// Extract domain from URL for proper URL-based duplicate detection
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return null;
  }
}

// Enhanced fuzzy matching for better duplicate detection
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Remove common words and check again
  const commonWords = ['ai', 'the', 'platform', 'tool', 'app', 'software', 'api', 'by', 'for'];
  const clean1 = s1.split(' ').filter(w => !commonWords.includes(w)).join(' ');
  const clean2 = s2.split(' ').filter(w => !commonWords.includes(w)).join(' ');

  if (clean1 === clean2) return 0.85;
  if (clean1.includes(clean2) || clean2.includes(clean1)) return 0.8;

  // Levenshtein distance for similar spellings
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const similarity = 1 - (distance / maxLen);

  return similarity;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// 3. INTELLIGENT DUPLICATE DETECTION
async function detectIntelligentDuplicates(platforms) {
  console.log('🔍 Using AI to detect intelligent duplicates...\n');

  // Group similar platforms with enhanced fuzzy matching
  const groups = [];
  const processed = new Set();

  for (let i = 0; i < platforms.length && groups.length < 20; i++) {
    if (processed.has(i)) continue;

    const platform1 = platforms[i];
    if (!platform1.name) continue;

    const similar = [platform1];

    for (let j = i + 1; j < platforms.length; j++) {
      if (processed.has(j)) continue;

      const platform2 = platforms[j];
      if (!platform2.name) continue;

      // Enhanced similarity check with fuzzy matching
      const nameSimilarity = calculateSimilarity(platform1.name, platform2.name);

      // Check URL similarity using domain extraction
      const domain1 = extractDomain(platform1.url || platform1.website);
      const domain2 = extractDomain(platform2.url || platform2.website);
      const urlSimilar = domain1 && domain2 && domain1 === domain2;

      // Mark as similar if name similarity > 0.75 or URLs match
      if (nameSimilarity >= 0.75 || urlSimilar) {
        similar.push(platform2);
        processed.add(j);
        console.log(`  📌 Found similar: "${platform1.name}" ≈ "${platform2.name}" (similarity: ${(nameSimilarity * 100).toFixed(0)}%)`);
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

  // Prioritize platforms needing enrichment
  const needsEnrichment = platforms
    .filter(p =>
      !p.description ||
      p.description.length < 50 ||
      !p.features ||
      !p.use_cases ||
      !p.pricing_details
    )
    .slice(0, 20); // Process 20 platforms per run

  console.log(`Found ${needsEnrichment.length} platforms needing enrichment\n`);

  for (const platform of needsEnrichment) {
    console.log(`  Enriching: ${platform.name}...`);

    const enriched = await enrichPlatform(platform);
    if (enriched && enriched.confidence > 0.6) {
      // Update all fields
      if (enriched.description) platform.description = enriched.description;
      if (enriched.category) platform.category = enriched.category;
      if (enriched.tags) platform.tags = enriched.tags;
      if (enriched.features) platform.features = enriched.features;
      if (enriched.use_cases) platform.use_cases = enriched.use_cases;
      if (enriched.pricing) platform.pricing = enriched.pricing;
      if (enriched.pricing_details) platform.pricing_details = enriched.pricing_details;
      if (enriched.target_audience) platform.target_audience = enriched.target_audience;
      if (enriched.has_api !== undefined) platform.has_api = enriched.has_api;
      if (enriched.has_affiliate !== undefined) platform.has_affiliate = enriched.has_affiliate;

      fixed++;
      console.log(`    ✅ Enhanced (confidence: ${(enriched.confidence * 100).toFixed(0)}%)`);
    } else {
      console.log(`    ⚠️  Low confidence, skipped`);
    }

    // Rate limiting (avoid API throttling)
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n✅ Enriched ${fixed} platforms\n`);
  return fixed;
}

// 5. RECATEGORIZE PLATFORMS TO BETTER-FITTING CATEGORIES
async function recategorizePlatforms() {
  console.log('🔄 AI-powered recategorization...\n');

  // Get all existing categories
  const existingCategories = [...new Set(platforms.map(p => p.category).filter(Boolean))].sort();
  console.log(`📊 Found ${existingCategories.length} existing categories:\n   ${existingCategories.join(', ')}\n`);

  // Find platforms that might need recategorization
  // Priority: platforms in generic categories that might fit better in specific ones
  const genericCategories = ['generative-ai', 'llms', 'ml-frameworks'];
  const specificCategories = existingCategories.filter(c => !genericCategories.includes(c));

  // Get platforms to check - prioritize those in generic categories
  const platformsToCheck = platforms
    .filter(p => genericCategories.includes(p.category) || !p.recategorized_date)
    .slice(0, CONFIG.max_recategorize);

  if (platformsToCheck.length === 0) {
    console.log('✅ All platforms have been recategorized recently\n');
    return 0;
  }

  console.log(`📋 Checking ${platformsToCheck.length} platforms for better category fits...\n`);

  let recategorized = 0;

  // Process in batches to reduce API calls
  const batchSize = 10;
  for (let i = 0; i < platformsToCheck.length; i += batchSize) {
    const batch = platformsToCheck.slice(i, i + batchSize);

    const prompt = `You are an AI platform categorization expert. Review these platforms and suggest better category assignments.

AVAILABLE CATEGORIES:
${existingCategories.map(c => `- ${c}`).join('\n')}

PLATFORMS TO REVIEW:
${batch.map((p, idx) => `
${idx + 1}. ${p.name}
   Current category: ${p.category}
   Description: ${p.description || 'N/A'}
   Tags: ${(p.tags || []).join(', ') || 'N/A'}
   URL: ${p.url || p.website || 'N/A'}
`).join('\n')}

TASK: For each platform, determine if it should be recategorized to a more specific/appropriate category.

RULES:
1. Only suggest a change if the new category is CLEARLY better
2. Prefer specific categories over generic ones (e.g., "audio-ai" over "generative-ai" for voice tools)
3. Consider the platform's primary function, not secondary features
4. If current category is already the best fit, keep it

Return JSON array:
[
  {
    "name": "Platform Name",
    "current_category": "current-category",
    "new_category": "better-category or null if no change needed",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation"
  }
]

ONLY return platforms that NEED category changes (confidence > 0.8). If a platform is already in the best category, omit it from the response.`;

    const response = await callAI(prompt);
    if (!response) continue;

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);

        for (const suggestion of suggestions) {
          if (!suggestion.new_category || suggestion.confidence < 0.8) continue;

          // Find and update the platform
          const platform = platforms.find(p =>
            p.name.toLowerCase() === suggestion.name.toLowerCase()
          );

          if (platform && suggestion.new_category !== platform.category) {
            const oldCategory = platform.category;
            platform.category = suggestion.new_category;
            platform.recategorized_date = new Date().toISOString();
            platform.recategorized_from = oldCategory;

            recategorized++;
            console.log(`  🔄 ${platform.name}: ${oldCategory} → ${suggestion.new_category}`);
            if (CONFIG.verbose) {
              console.log(`     Reason: ${suggestion.reasoning}`);
            }
          }
        }
      }
    } catch (error) {
      if (CONFIG.verbose) {
        console.error(`  ⚠️  Failed to parse recategorization response:`, error.message);
      }
    }

    // Rate limiting
    if (i + batchSize < platformsToCheck.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n✅ Recategorized ${recategorized} platforms\n`);
  return recategorized;
}

// SAVE AFFILIATE OPPORTUNITIES
function saveAffiliateOpportunities() {
  if (affiliateOpportunities.length === 0) return;

  const timestamp = new Date().toISOString().split('T')[0];

  let markdown = `# 💰 Affiliate Program Opportunities\n\n`;
  markdown += `Generated: ${timestamp}\n`;
  markdown += `Total Opportunities: ${affiliateOpportunities.length}\n\n`;
  markdown += `---\n\n`;

  affiliateOpportunities.forEach((opp, index) => {
    markdown += `## ${index + 1}. ${opp.name}\n\n`;
    markdown += `**Category:** ${opp.category}\n`;
    markdown += `**Website:** ${opp.url}\n`;
    markdown += `**Pricing Model:** ${opp.pricing}\n\n`;
    markdown += `**Description:**\n${opp.description}\n\n`;

    if (opp.affiliate_info) {
      markdown += `**💵 Affiliate Program Details:**\n`;
      markdown += `${opp.affiliate_info}\n\n`;
    }

    markdown += `**Action Items:**\n`;
    markdown += `- [ ] Visit website and locate partner/affiliate program page\n`;
    markdown += `- [ ] Sign up for affiliate program\n`;
    markdown += `- [ ] Get your unique affiliate link\n`;
    markdown += `- [ ] Add affiliate link to platform entry\n`;
    markdown += `- [ ] Test the affiliate link\n\n`;

    markdown += `---\n\n`;
  });

  markdown += `\n## 📋 Quick Sign-up Checklist\n\n`;
  affiliateOpportunities.forEach((opp, index) => {
    markdown += `${index + 1}. [ ] **${opp.name}** - ${opp.url}\n`;
  });

  writeFileSync(CONFIG.affiliate_opportunities_path, markdown, 'utf-8');
  console.log(`\n💰 Saved ${affiliateOpportunities.length} affiliate opportunities to affiliate-opportunities.md\n`);
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

      // Get existing categories for validation
      const existingCategories = [...new Set(platforms.map(p => p.category).filter(Boolean))].sort();

      newPlatforms.forEach(np => {
        // Check for duplicates one more time (case-insensitive)
        const isDuplicate = platforms.some(p =>
          p.name && np.name && p.name.toLowerCase() === np.name.toLowerCase()
        );

        if (isDuplicate) {
          console.log(`  ⚠️  Skipped duplicate: ${np.name}`);
          return;
        }

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

        // Add rich data fields
        if (np.features && Array.isArray(np.features)) {
          platform.features = np.features;
        }
        if (np.use_cases && Array.isArray(np.use_cases)) {
          platform.use_cases = np.use_cases;
        }

        // Only keep affiliate flag in main platforms.json
        if (np.has_affiliate) {
          platform.has_affiliate = true;
        }

        // Save detailed affiliate info to separate file
        if (np.has_affiliate && np.affiliate_info) {
          affiliateOpportunities.push({
            name: np.name,
            url: np.url,
            category: np.category,
            description: np.description,
            pricing: np.pricing || 'unknown',
            affiliate_info: np.affiliate_info,
            added_date: new Date().toISOString()
          });
        }

        platforms.push(platform);

        const affiliateTag = platform.has_affiliate ? ' 💰' : '';
        const newCategoryTag = !existingCategories.includes(np.category) ? ' 🆕' : '';
        console.log(`  ✅ Added: ${platform.name}${affiliateTag}${newCategoryTag}`);
        if (newCategoryTag && CONFIG.verbose) {
          console.log(`     🆕 New category: ${np.category}`);
        }
        if (np.affiliate_info && CONFIG.verbose) {
          console.log(`     💵 ${np.affiliate_info}`);
        }
      });

      console.log();
    }

  } else if (CONFIG.mode === 'enrich') {
    console.log('MODE: Enrich existing platforms\n');
    enriched = await autoFixWithAI();

  } else if (CONFIG.mode === 'recategorize') {
    console.log('MODE: Recategorize platforms to better-fitting categories\n');
    enriched = await recategorizePlatforms();

  } else if (CONFIG.mode === 'fix-all') {
    console.log('MODE: Comprehensive AI fix\n');

    // Enrich
    enriched = await autoFixWithAI();

    // Recategorize
    const recategorized = await recategorizePlatforms();
    enriched += recategorized;

    // Detect duplicates
    duplicateDecisions = await detectIntelligentDuplicates(platforms);

  } else {
    console.log('MODE: Analyze only (no changes)\n');

    console.log('Available modes:');
    console.log('  --discover       Discover and add new platforms');
    console.log('  --enrich         Enrich existing platform data');
    console.log('  --recategorize   Recategorize platforms to better categories');
    console.log('  --fix-all        Comprehensive fix (enrich + recategorize + duplicates)');
    console.log('\nFlags:');
    console.log('  --auto-add       Automatically add discovered platforms');
    console.log('  --max=N          Max new platforms to discover (default: 10)');
    console.log('  --recat-max=N    Max platforms to recategorize (default: 30)');
    console.log('  --verbose        Show detailed output');
    console.log('  --dry-run        Don\'t save changes\n');
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
    console.log('✅ Saved!');

    // Save affiliate opportunities to separate file
    saveAffiliateOpportunities();
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
  if (affiliateOpportunities.length > 0) {
    console.log(`  💰 Affiliate Opportunities: ${affiliateOpportunities.length}`);
    console.log(`     📄 Check affiliate-opportunities.md for signup details`);
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
