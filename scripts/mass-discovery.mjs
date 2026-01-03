#!/usr/bin/env node
/**
 * Mass Platform Discovery - HIGH VOLUME MODE
 *
 * Discovers hundreds of platforms per run
 * Uses parallel workers and multiple data sources
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  // MASSIVE DISCOVERY SETTINGS
  platforms_per_batch: parseInt(process.argv.find(arg => arg.startsWith('--batch='))?.split('=')[1]) || 100,
  num_batches: parseInt(process.argv.find(arg => arg.startsWith('--batches='))?.split('=')[1]) || 5,
  parallel_workers: parseInt(process.argv.find(arg => arg.startsWith('--workers='))?.split('=')[1]) || 3,
  auto_add: !process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

let platforms = [];

try {
  platforms = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8'));
  console.log(`📊 Current platforms: ${platforms.length}\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

if (!CONFIG.deepseek_api_key) {
  console.error('❌ DEEPSEEK_API_KEY not set!');
  process.exit(1);
}

// Extract domain from URL
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return null;
  }
}

// Calculate similarity
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const commonWords = ['ai', 'the', 'platform', 'tool', 'app', 'software', 'api', 'by', 'for'];
  const clean1 = s1.split(' ').filter(w => !commonWords.includes(w)).join(' ');
  const clean2 = s2.split(' ').filter(w => !commonWords.includes(w)).join(' ');

  if (clean1 === clean2) return 0.85;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

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

// Call DeepSeek
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
        temperature: 0.8, // Higher creativity for diverse results
        max_tokens: 8000 // Increased to prevent truncation
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

// Discovery sources - expand coverage
const DISCOVERY_SOURCES = [
  'Product Hunt (AI, Developer Tools, Productivity categories)',
  'GitHub Trending (AI/ML repositories)',
  'Papers with Code',
  'Hugging Face Hub and Spaces',
  'Reddit (r/artificial, r/MachineLearning, r/LocalLLaMA, r/StableDiffusion)',
  'Twitter/X AI announcements and launches',
  'TechCrunch AI section',
  'VentureBeat AI coverage',
  'The Verge AI news',
  'AI news aggregators (AiToolGuru, Futurepedia, There\'s An AI For That)',
  'Y Combinator startups (AI category)',
  'Indie Hackers AI projects',
  'Dev.to AI tags',
  'Kaggle platforms',
  'Google Cloud Marketplace (AI)',
  'AWS Marketplace (Machine Learning)',
  'Azure Marketplace (AI + Machine Learning)',
  'Zapier App Directory (AI tools)',
  'Make.com integrations',
  'Chrome Web Store (AI extensions)',
  'VSCode Marketplace (AI extensions)',
  'npm (AI/ML packages)',
  'PyPI (machine learning packages)',
  'Docker Hub (AI/ML containers)',
  'ArXiv recent papers',
  'OpenAI ecosystem',
  'Anthropic ecosystem',
  'Google AI ecosystem',
  'Meta AI projects',
  'Microsoft AI platforms',
  'Open source AI projects',
  'AI startups funding announcements',
  'AI directories and aggregators'
];

// Discover platforms in parallel
async function discoverBatch(batchNum, platformsPerBatch) {
  const existingNames = platforms.map(p => p.name?.toLowerCase()).filter(Boolean);
  const existingDomains = new Set(platforms.map(p => extractDomain(p.url || p.website)).filter(Boolean));
  const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];

  const prompt = `You are discovering the LATEST AI platforms as of DECEMBER 2026.

TODAY'S DATE: December 16, 2026

MISSION: Find the most RECENT, POPULAR, and UP-TO-DATE platforms launched or significantly updated in late 2024 - December 2026.

CRITICAL - We already have ${platforms.length} platforms. DO NOT suggest duplicates!

Sample existing platforms to avoid:
${existingNames.slice(0, 50).join(', ')}... (and ${existingNames.length - 50} more)

Sample existing domains to avoid:
${Array.from(existingDomains).slice(0, 30).join(', ')}... (and ${Array.from(existingDomains).length - 30} more)

CATEGORIES: ${categories.join(', ')}

DISCOVERY SOURCES TO SEARCH:
${DISCOVERY_SOURCES.join('\n')}

TASK: Find UP TO ${platformsPerBatch} COMPLETELY NEW platforms (BATCH ${batchNum}):

🚨 CRITICAL - DO NOT HALLUCINATE OR MAKE UP PLATFORMS! 🚨
- ONLY suggest platforms you can VERIFY exist
- ONLY include platforms from REAL sources (Product Hunt, GitHub, news articles)
- If you can't find ${platformsPerBatch} REAL platforms, return FEWER
- Fake platforms will be automatically detected and removed
- We prefer QUALITY over QUANTITY - 10 real platforms > 25 fake ones

VERSION UPDATES - VERY IMPORTANT:
🔄 If you find NEWER versions of existing platforms (e.g., GPT-4.5, Claude 3.7, Gemini 2.0):
   - Include the NEW version in your response
   - Mark it with "replaces": "old platform name"
   - We will automatically REMOVE the old version and add the new one
   - Example: {"name": "GPT-4.5 Turbo", "replaces": "GPT-4", ...}

REQUIREMENTS:
✅ MUST be from DECEMBER 2026 or late 2024 (prioritize most recent!)
✅ MUST have a working website with CORRECT URL
✅ MUST be a REAL company/product (not made up)
✅ MUST be actively maintained and popular
✅ MUST NOT be in existing list (unless it's a newer version)
✅ Different domain from existing platforms (unless version update)
✅ Active user base with recent activity (check Twitter, GitHub, Product Hunt)
❌ NO old platforms from 2023 or earlier
❌ NO duplicates or variations of existing platforms
❌ NO defunct/shutdown platforms
❌ NO made-up or imaginary platforms
❌ NO guessed URLs - must be actual verified URLs

PRIORITIZATION (in order of importance):
1. 🆕 DECEMBER 2026 launches (most important!)
2. ⭐ November/October 2026 platforms from Product Hunt
3. 🔥 Trending on GitHub in Q4 2026 (repos with >1000 stars)
4. 📰 Tech news from November-December 2026 (TechCrunch, VentureBeat, The Verge)
5. 🚀 Y Combinator W25 batch (most recent!)
6. 💰 Popular SaaS platforms with active users
7. 🔄 Major version updates of existing platforms (GPT-5, Claude 4, Gemini 2.0, etc.)

FOCUS ON WELL-KNOWN PLATFORMS that have:
- Product Hunt launches with 100+ upvotes
- GitHub repos with >1000 stars
- Tech news coverage from major outlets
- Active social media presence
- Public pricing and feature pages

DIVERSITY:
- Include platforms from DIFFERENT sources
- Mix of categories (LLMs, code, vision, audio, video, etc.)
- Variety of use cases (developer tools, business, creative, etc.)
- Range of pricing (free, freemium, paid, enterprise)

For each platform, provide:
- name: Official name (must be unique!)
- description: 2-3 sentences (what it does, key features, target users)
- url: Official website (must be working, unique domain)
- category: Best fit category (use existing or create new)
- tags: 6-8 specific tags
- pricing: free/freemium/paid/enterprise/open-source
- features: 4-5 key features
- use_cases: 3-4 real use cases
- launched_date: "2024-XX" or "2026-XX" (prioritize 2026-12 for December!)
- has_affiliate: true/false
- affiliate_commission: "% or $X" if known
- monthly_pricing: "$X" or "Free" or "Custom"
- source: Where you found it (e.g., "Product Hunt Dec 2026", "GitHub Trending Dec 2026")
- replaces: "old platform name" (ONLY if this is a newer version of existing platform)

Return ONLY valid JSON array:
[
  {
    "name": "NewAI Platform",
    "description": "Latest AI tool launched December 2026...",
    "url": "https://newai.example",
    "category": "...",
    "tags": [...],
    "pricing": "freemium",
    "features": [...],
    "use_cases": [...],
    "launched_date": "2026-12",
    "has_affiliate": true,
    "affiliate_commission": "30%",
    "monthly_pricing": "$29",
    "source": "Product Hunt #1 Dec 16, 2026"
  },
  {
    "name": "GPT-5 Turbo",
    "description": "OpenAI's newest model...",
    "url": "https://openai.com",
    "replaces": "GPT-4",
    "launched_date": "2026-12",
    "source": "OpenAI Official Release Dec 2026"
  }
]

IMPORTANT REMINDERS:
1. 🆕 PRIORITIZE DECEMBER 2026 platforms - these are most valuable!
2. Each platform must be UNIQUE - different name AND different domain
3. VERIFY the URL is correct - don't guess domain names
4. ONLY include platforms you're CONFIDENT are real
5. If unsure about a platform's existence, SKIP IT
6. It's better to return 10 REAL recent platforms than 25 old/fake ones
7. Focus on POPULAR, TRENDING platforms from December 2026
8. Check for VERSION UPDATES - if GPT-5, Claude 4, Gemini 2.0 exist, include them!

EXAMPLES OF GOOD SOURCES (December 2026):
- "Product Hunt #1 Product of the Day Dec 16, 2026"
- "GitHub trending Dec 2026 (20k stars)"
- "TechCrunch AI news Dec 2026 - launch announcement"
- "Y Combinator W25 batch (Dec 2026 cohort)"
- "OpenAI/Anthropic/Google official release Dec 2026"

BAD RESPONSES (will be rejected):
- Old platforms from 2023 or early 2024
- Made-up domain names like "cooltool.ai" without verification
- Generic names like "AI Assistant Pro" without specific details
- Platforms with no verifiable source or presence`;

  const response = await callDeepSeek(prompt);
  if (!response) return [];

  try {
    let jsonText = response;

    // Extract JSON array - try multiple patterns
    let jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    } else {
      // Try to find start of array
      const arrayStart = response.indexOf('[');
      if (arrayStart !== -1) {
        jsonText = response.substring(arrayStart);
        // Try to fix incomplete JSON by finding last complete object
        const lastCompleteObj = jsonText.lastIndexOf('}');
        if (lastCompleteObj !== -1) {
          jsonText = jsonText.substring(0, lastCompleteObj + 1);
          // Ensure array is closed
          if (!jsonText.endsWith(']')) {
            jsonText += ']';
          }
        }
      }
    }

    const discovered = JSON.parse(jsonText);
    if (!Array.isArray(discovered)) {
      console.error(`  Batch ${batchNum}: Response is not an array`);
      return [];
    }

    console.log(`  Batch ${batchNum}: Received ${discovered.length} platforms from AI`);
    return discovered;
  } catch (error) {
    console.error(`  Batch ${batchNum}: Failed to parse response:`, error.message);
    if (CONFIG.verbose) {
      console.error('  Response preview:', response?.substring(0, 500));
    }
    return [];
  }
}

// Check if platform is duplicate
function isDuplicate(newPlatform, existingPlatforms) {
  for (const existing of existingPlatforms) {
    if (!existing.name) continue;

    // Name similarity check
    const similarity = calculateSimilarity(newPlatform.name, existing.name);
    if (similarity >= 0.75) {
      return { isDupe: true, reason: 'name', match: existing.name, similarity };
    }

    // URL domain check
    const newDomain = extractDomain(newPlatform.url);
    const existingDomain = extractDomain(existing.url || existing.website);
    if (newDomain && existingDomain && newDomain === existingDomain) {
      return { isDupe: true, reason: 'domain', match: existingDomain };
    }
  }

  return { isDupe: false };
}

// Main
async function main() {
  console.log('🚀 MASS PLATFORM DISCOVERY - HIGH VOLUME MODE\n');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`⚙️  Configuration:`);
  console.log(`   Platforms per batch: ${CONFIG.platforms_per_batch}`);
  console.log(`   Number of batches: ${CONFIG.num_batches}`);
  console.log(`   Parallel workers: ${CONFIG.parallel_workers}`);
  console.log(`   Target discovery: ${CONFIG.platforms_per_batch * CONFIG.num_batches} platforms`);
  console.log(`   Auto-add: ${CONFIG.auto_add ? 'YES' : 'NO (dry run)'}\n`);

  const startCount = platforms.length;
  const allDiscovered = [];
  let totalDuplicatesFound = 0;
  let totalReplacements = 0;
  const replacedPlatforms = [];

  // Run batches in parallel groups
  for (let batchGroup = 0; batchGroup < CONFIG.num_batches; batchGroup += CONFIG.parallel_workers) {
    const batchNumbers = [];
    for (let i = 0; i < CONFIG.parallel_workers && (batchGroup + i) < CONFIG.num_batches; i++) {
      batchNumbers.push(batchGroup + i + 1);
    }

    console.log(`\n🔍 Running batches ${batchNumbers.join(', ')} in parallel...\n`);

    // Run batches in parallel
    const batchPromises = batchNumbers.map(batchNum =>
      discoverBatch(batchNum, CONFIG.platforms_per_batch)
    );

    const results = await Promise.all(batchPromises);

    // Process results from all parallel batches
    for (const discovered of results) {
      for (const platform of discovered) {
        // Check if this platform REPLACES an older version
        if (platform.replaces) {
          const oldPlatformName = platform.replaces.toLowerCase();
          const oldPlatformIndex = platforms.findIndex(p =>
            p.name.toLowerCase().includes(oldPlatformName) ||
            oldPlatformName.includes(p.name.toLowerCase())
          );

          if (oldPlatformIndex !== -1) {
            const oldPlatform = platforms[oldPlatformIndex];
            console.log(`  🔄 UPGRADE: "${oldPlatform.name}" → "${platform.name}" (${platform.source})`);

            // Remove old version
            platforms.splice(oldPlatformIndex, 1);
            replacedPlatforms.push({ old: oldPlatform.name, new: platform.name });
            totalReplacements++;

            // Add new version
            allDiscovered.push({
              ...platform,
              id: `platform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              slug: platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              added_date: new Date().toISOString(),
              discovered_by: 'mass-discovery',
              rating: oldPlatform.rating || null, // Preserve rating from old version
              featured: oldPlatform.featured || false, // Preserve featured status
              clicks: oldPlatform.clicks || 0 // Preserve click count
            });

            // Remove the 'replaces' field before saving
            delete allDiscovered[allDiscovered.length - 1].replaces;
            continue;
          } else {
            console.log(`  ⚠️  Platform claims to replace "${platform.replaces}" but it wasn't found - adding as new`);
          }
        }

        // Normal duplicate check for non-replacement platforms
        const dupeCheck = isDuplicate(platform, [...platforms, ...allDiscovered]);

        if (dupeCheck.isDupe) {
          totalDuplicatesFound++;
          if (CONFIG.verbose) {
            console.log(`  ⚠️  SKIP (${dupeCheck.reason}): "${platform.name}" → matches "${dupeCheck.match}"`);
          }
        } else {
          allDiscovered.push({
            ...platform,
            id: `platform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            slug: platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            added_date: new Date().toISOString(),
            discovered_by: 'mass-discovery',
            rating: null,
            featured: false,
            clicks: 0
          });
          console.log(`  ✅ NEW: ${platform.name} (${platform.category}) - ${platform.source}`);
        }
      }
    }

    // Small delay between batch groups
    if (batchGroup + CONFIG.parallel_workers < CONFIG.num_batches) {
      console.log(`\n⏸️  Cooling down (2s)...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════');
  console.log('📊 MASS DISCOVERY SUMMARY');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`Starting platforms: ${startCount}`);
  console.log(`Total discovered: ${allDiscovered.length}`);
  console.log(`Duplicates filtered: ${totalDuplicatesFound}`);
  console.log(`🔄 Version upgrades: ${totalReplacements}`);
  console.log(`New unique platforms: ${allDiscovered.length}`);
  console.log(`Final count: ${startCount + allDiscovered.length - totalReplacements}\n`);

  if (replacedPlatforms.length > 0) {
    console.log('🔄 Upgraded Platforms:');
    replacedPlatforms.forEach(({ old, new: newName }) => {
      console.log(`   "${old}" → "${newName}"`);
    });
    console.log('');
  }

  // Category breakdown
  const categoryCount = {};
  allDiscovered.forEach(p => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });

  console.log('📂 By Category:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

  // Affiliate opportunities
  const withAffiliates = allDiscovered.filter(p => p.has_affiliate);
  console.log(`\n💰 Affiliate Opportunities: ${withAffiliates.length}`);

  // Save results
  if (CONFIG.auto_add && allDiscovered.length > 0) {
    platforms.push(...allDiscovered);

    writeFileSync(CONFIG.platforms_path, JSON.stringify(platforms, null, 2));
    console.log(`\n✅ Added ${allDiscovered.length} platforms to platforms.json`);

    // Generate report
    let report = `# Mass Discovery Report - December 2026\n\n`;
    report += `Date: ${new Date().toLocaleString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Discovered: ${allDiscovered.length} platforms\n`;
    report += `- Version upgrades: ${totalReplacements}\n`;
    report += `- With affiliates: ${withAffiliates.length}\n`;
    report += `- New categories: ${Object.keys(categoryCount).length}\n\n`;

    if (replacedPlatforms.length > 0) {
      report += `## 🔄 Version Upgrades\n\n`;
      replacedPlatforms.forEach(({ old, new: newName }) => {
        report += `- "${old}" → "${newName}"\n`;
      });
      report += `\n`;
    }
    report += `## New Platforms\n\n`;
    allDiscovered.forEach(p => {
      report += `### ${p.name}\n`;
      report += `- **Category**: ${p.category}\n`;
      report += `- **URL**: ${p.url}\n`;
      report += `- **Pricing**: ${p.monthly_pricing || p.pricing}\n`;
      if (p.has_affiliate) report += `- **Affiliate**: ${p.affiliate_commission}\n`;
      report += `- **Source**: ${p.source}\n`;
      report += `\n`;
    });

    writeFileSync(join(__dirname, '../MASS_DISCOVERY_REPORT.md'), report);
    console.log(`✅ Generated report: MASS_DISCOVERY_REPORT.md`);
  } else {
    console.log(`\n⚠️  DRY RUN - No changes saved`);
  }

  console.log('\n🎉 Mass discovery complete!\n');
}

main().catch(console.error);
