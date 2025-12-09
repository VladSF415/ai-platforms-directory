#!/usr/bin/env node
/**
 * Affiliate Program Hunter
 *
 * Scans all platforms to identify affiliate/referral programs
 * Extracts commission rates, cookie duration, program URLs
 * Generates monetization report
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  output_path: join(__dirname, '../affiliate-opportunities.json'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  batch_size: 10, // Process 10 platforms at a time
  verbose: process.argv.includes('--verbose'),
  dry_run: process.argv.includes('--dry-run'),
};

let platforms = [];

// Load platforms
try {
  platforms = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8'));
  console.log(`📊 Loaded ${platforms.length} platforms\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

// Check API key
if (!CONFIG.deepseek_api_key) {
  console.error('❌ DEEPSEEK_API_KEY not set!');
  console.error('Set: export DEEPSEEK_API_KEY="sk-..."');
  process.exit(1);
}

// Call DeepSeek API
async function callDeepSeek(prompt, system = '') {
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
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${data.error?.message || response.statusText}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ DeepSeek API call failed:', error.message);
    return null;
  }
}

// Research affiliate program for a platform
async function researchAffiliateProgram(platform) {
  const prompt = `Research the affiliate/referral program for this AI platform:

PLATFORM: ${platform.name}
WEBSITE: ${platform.url || platform.website || 'N/A'}
CATEGORY: ${platform.category}
DESCRIPTION: ${platform.description || 'N/A'}

TASK: Determine if this platform has an affiliate or referral program and extract ALL details.

Search for:
1. Partner program pages on their website
2. Affiliate networks (Impact, PartnerStack, ShareASale, CJ, Rakuten)
3. Referral programs
4. Partner/reseller programs
5. Commission structures

Return ONLY valid JSON:
{
  "has_program": true/false,
  "program_type": "affiliate/referral/partner/none",
  "commission_rate": "X% recurring" or "X% one-time" or "unknown",
  "commission_structure": "Details about tiers, recurring vs one-time",
  "cookie_duration": "X days" or "unknown",
  "network": "Impact/PartnerStack/Direct/etc" or "unknown",
  "program_url": "https://..." or null,
  "signup_requirements": "approved/self-serve/by-application/unknown",
  "minimum_payout": "$XX" or "unknown",
  "average_deal_size": "$XX/month" or "unknown",
  "revenue_potential": "low/medium/high/very-high",
  "notes": "Any additional relevant info",
  "confidence": 0.0-1.0
}

IMPORTANT:
- If you can't find concrete info, mark as "unknown" and lower confidence
- Don't guess - only include verified information
- Check common affiliate networks if not on their site
- Look for "/partners", "/affiliates", "/referral" pages`;

  const response = await callDeepSeek(prompt, 'You are an expert at finding and analyzing affiliate marketing programs.');

  if (!response) return null;

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    if (CONFIG.verbose) {
      console.error(`  ⚠️  Failed to parse response for ${platform.name}`);
    }
  }

  return null;
}

// Main execution
async function main() {
  console.log('💰 AFFILIATE PROGRAM HUNTER\n');
  console.log('Scanning platforms for monetization opportunities...\n');

  const results = [];
  const affiliateOpportunities = [];

  // Prioritize platforms by revenue potential
  const prioritized = platforms
    .filter(p => p.name && (p.url || p.website))
    .sort((a, b) => {
      // Featured platforms first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Higher rated platforms
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      return ratingB - ratingA;
    });

  console.log(`🎯 Prioritized ${prioritized.length} platforms for scanning\n`);

  // Process in batches
  for (let i = 0; i < prioritized.length; i++) {
    const platform = prioritized[i];

    console.log(`[${i + 1}/${prioritized.length}] Researching: ${platform.name}`);

    const affiliateData = await researchAffiliateProgram(platform);

    if (affiliateData) {
      results.push({
        platform_id: platform.id,
        platform_name: platform.name,
        platform_url: platform.url || platform.website,
        category: platform.category,
        ...affiliateData
      });

      if (affiliateData.has_program && affiliateData.confidence > 0.5) {
        console.log(`  ✅ FOUND: ${affiliateData.program_type} program - ${affiliateData.commission_rate}`);
        affiliateOpportunities.push({
          platform: platform.name,
          url: platform.url || platform.website,
          ...affiliateData
        });
      } else if (affiliateData.has_program) {
        console.log(`  ⚠️  MAYBE: Low confidence (${(affiliateData.confidence * 100).toFixed(0)}%)`);
      } else {
        console.log(`  ❌ No program found`);
      }
    } else {
      console.log(`  ⚠️  Failed to research`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate report
  console.log('\n\n📊 MONETIZATION REPORT\n');
  console.log(`Total platforms scanned: ${results.length}`);
  console.log(`Affiliate programs found: ${affiliateOpportunities.length}`);
  console.log(`Conversion rate: ${((affiliateOpportunities.length / results.length) * 100).toFixed(1)}%\n`);

  // Categorize by revenue potential
  const highValue = affiliateOpportunities.filter(a => a.revenue_potential === 'very-high' || a.revenue_potential === 'high');
  const mediumValue = affiliateOpportunities.filter(a => a.revenue_potential === 'medium');
  const lowValue = affiliateOpportunities.filter(a => a.revenue_potential === 'low');

  console.log(`🔥 High-value opportunities: ${highValue.length}`);
  console.log(`💰 Medium-value opportunities: ${mediumValue.length}`);
  console.log(`💵 Low-value opportunities: ${lowValue.length}\n`);

  // Show top opportunities
  console.log('🌟 TOP 10 OPPORTUNITIES:\n');
  highValue.slice(0, 10).forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.platform}`);
    console.log(`   Commission: ${opp.commission_rate}`);
    console.log(`   Network: ${opp.network}`);
    console.log(`   Potential: ${opp.revenue_potential}`);
    if (opp.program_url) {
      console.log(`   URL: ${opp.program_url}`);
    }
    console.log('');
  });

  // Save results
  if (!CONFIG.dry_run) {
    writeFileSync(CONFIG.output_path, JSON.stringify(results, null, 2));
    console.log(`✅ Saved detailed results to: ${CONFIG.output_path}`);

    // Update platforms.json with affiliate data
    platforms.forEach(p => {
      const result = results.find(r => r.platform_id === p.id);
      if (result && result.has_program) {
        p.has_affiliate = true;
        p.affiliate_program = {
          type: result.program_type,
          commission: result.commission_rate,
          network: result.network,
          url: result.program_url
        };
      }
    });

    writeFileSync(CONFIG.platforms_path, JSON.stringify(platforms, null, 2));
    console.log(`✅ Updated platforms.json with affiliate data`);

    // Generate markdown report
    let markdown = '# Affiliate Program Opportunities\n\n';
    markdown += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- Total platforms scanned: **${results.length}**\n`;
    markdown += `- Affiliate programs found: **${affiliateOpportunities.length}**\n`;
    markdown += `- High-value opportunities: **${highValue.length}**\n\n`;

    markdown += `## High-Value Opportunities\n\n`;
    highValue.forEach(opp => {
      markdown += `### ${opp.platform}\n\n`;
      markdown += `- **Category**: ${opp.category}\n`;
      markdown += `- **Commission**: ${opp.commission_rate}\n`;
      markdown += `- **Network**: ${opp.network}\n`;
      markdown += `- **Cookie Duration**: ${opp.cookie_duration}\n`;
      if (opp.program_url) {
        markdown += `- **Program URL**: ${opp.program_url}\n`;
      }
      markdown += `- **Revenue Potential**: ${opp.revenue_potential}\n`;
      if (opp.notes) {
        markdown += `- **Notes**: ${opp.notes}\n`;
      }
      markdown += '\n';
    });

    writeFileSync(join(__dirname, '../AFFILIATE_OPPORTUNITIES.md'), markdown);
    console.log(`✅ Generated markdown report: AFFILIATE_OPPORTUNITIES.md`);
  }

  console.log('\n🎉 Affiliate hunting complete!');
}

main().catch(console.error);
