#!/usr/bin/env node
/**
 * URL Validator - Check for dead/fake platforms
 *
 * Checks all platform URLs and identifies:
 * - Dead URLs (404, timeout, DNS errors)
 * - Parked domains
 * - Redirects to unrelated sites
 * - Fake/non-existent platforms
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  dead_urls_report: join(__dirname, '../DEAD_URLS_REPORT.json'),
  timeout: 10000, // 10 seconds
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  max_concurrent: 10,
  auto_remove: process.argv.includes('--remove'),
  verbose: process.argv.includes('--verbose'),
  max_check: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || null
};

let platforms = [];
try {
  platforms = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8'));
  console.log(`📊 Loaded ${platforms.length} platforms\n`);
} catch (error) {
  console.error('❌ Failed to load platforms:', error);
  process.exit(1);
}

// Check URL status
async function checkURL(url, platformName) {
  if (!url) return { status: 'missing_url', error: 'No URL provided' };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': CONFIG.user_agent },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    // Check for parked domain indicators
    const finalUrl = response.url;
    const parkedIndicators = [
      'domain-for-sale',
      'parked-domain',
      'this-domain-is-for-sale',
      'godaddy.com/parking',
      'afternic.com',
      'sedo.com/search',
      'hugedomains.com',
      'dan.com'
    ];

    const isParked = parkedIndicators.some(indicator =>
      finalUrl.toLowerCase().includes(indicator)
    );

    if (isParked) {
      return {
        status: 'parked',
        httpStatus: response.status,
        finalUrl,
        error: 'Domain is parked/for sale'
      };
    }

    // Check for redirect to completely different domain
    const originalDomain = new URL(url).hostname.replace('www.', '');
    const finalDomain = new URL(finalUrl).hostname.replace('www.', '');

    if (originalDomain !== finalDomain && !finalDomain.includes(originalDomain.split('.')[0])) {
      return {
        status: 'redirected',
        httpStatus: response.status,
        originalUrl: url,
        finalUrl,
        warning: 'Redirects to different domain'
      };
    }

    if (response.status === 404) {
      return { status: 'dead', httpStatus: 404, error: 'Page not found' };
    }

    if (response.status >= 500) {
      return { status: 'server_error', httpStatus: response.status, error: 'Server error' };
    }

    if (response.status >= 400) {
      return { status: 'client_error', httpStatus: response.status, error: 'Client error' };
    }

    return {
      status: 'alive',
      httpStatus: response.status,
      finalUrl: response.url
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      return { status: 'timeout', error: 'Request timeout' };
    }

    if (error.code === 'ENOTFOUND' || error.cause?.code === 'ENOTFOUND') {
      return { status: 'dns_error', error: 'Domain not found (DNS)' };
    }

    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      return { status: 'connection_refused', error: 'Connection refused' };
    }

    return {
      status: 'error',
      error: error.message || 'Unknown error'
    };
  }
}

// Process platforms in batches
async function checkPlatformsInBatches(platforms, batchSize) {
  const results = {
    alive: [],
    dead: [],
    parked: [],
    redirected: [],
    timeout: [],
    dns_error: [],
    server_error: [],
    other_error: []
  };

  const toCheck = CONFIG.max_check ? platforms.slice(0, CONFIG.max_check) : platforms;

  console.log(`🔍 Checking ${toCheck.length} platform URLs...\n`);

  for (let i = 0; i < toCheck.length; i += batchSize) {
    const batch = toCheck.slice(i, i + batchSize);
    const batchPromises = batch.map(async (platform) => {
      const url = platform.url || platform.website;
      const result = await checkURL(url, platform.name);

      if (CONFIG.verbose) {
        const statusIcon = {
          alive: '✅',
          dead: '💀',
          parked: '🅿️',
          redirected: '↪️',
          timeout: '⏱️',
          dns_error: '🚫',
          server_error: '🔥',
          error: '❌'
        }[result.status] || '❓';

        console.log(`  ${statusIcon} ${platform.name}: ${result.status} (${result.httpStatus || 'N/A'})`);
      }

      return { platform, result };
    });

    const batchResults = await Promise.all(batchPromises);

    for (const { platform, result } of batchResults) {
      if (result.status === 'alive') {
        results.alive.push(platform);
      } else if (result.status === 'dead' || result.status === 'client_error') {
        results.dead.push({ ...platform, check_result: result });
      } else if (result.status === 'parked') {
        results.parked.push({ ...platform, check_result: result });
      } else if (result.status === 'redirected') {
        results.redirected.push({ ...platform, check_result: result });
      } else if (result.status === 'timeout') {
        results.timeout.push({ ...platform, check_result: result });
      } else if (result.status === 'dns_error' || result.status === 'connection_refused') {
        results.dns_error.push({ ...platform, check_result: result });
      } else if (result.status === 'server_error') {
        results.server_error.push({ ...platform, check_result: result });
      } else {
        results.other_error.push({ ...platform, check_result: result });
      }
    }

    // Progress indicator
    const progress = Math.min(i + batchSize, toCheck.length);
    console.log(`Progress: ${progress}/${toCheck.length} checked`);
  }

  return results;
}

// Main
async function main() {
  console.log('🔍 URL VALIDATOR - Checking platform URLs\n');
  console.log('═══════════════════════════════════════════════\n');

  const results = await checkPlatformsInBatches(platforms, CONFIG.max_concurrent);

  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════\n');

  console.log(`✅ Alive: ${results.alive.length}`);
  console.log(`💀 Dead (404/errors): ${results.dead.length}`);
  console.log(`🅿️  Parked domains: ${results.parked.length}`);
  console.log(`🚫 DNS errors: ${results.dns_error.length}`);
  console.log(`↪️  Suspicious redirects: ${results.redirected.length}`);
  console.log(`⏱️  Timeouts: ${results.timeout.length}`);
  console.log(`🔥 Server errors: ${results.server_error.length}`);
  console.log(`❌ Other errors: ${results.other_error.length}\n`);

  // Platforms to remove
  const toRemove = [
    ...results.dead,
    ...results.parked,
    ...results.dns_error
  ];

  if (toRemove.length > 0) {
    console.log('🗑️  PLATFORMS TO REMOVE:\n');
    toRemove.forEach(p => {
      console.log(`  - ${p.name} (${p.url || p.website})`);
      console.log(`    Reason: ${p.check_result.status} - ${p.check_result.error}`);
    });
  }

  // Save report
  const report = {
    checked_at: new Date().toISOString(),
    total_checked: CONFIG.max_check || platforms.length,
    results: {
      alive: results.alive.length,
      dead: results.dead.length,
      parked: results.parked.length,
      dns_error: results.dns_error.length,
      redirected: results.redirected.length,
      timeout: results.timeout.length,
      server_error: results.server_error.length,
      other_error: results.other_error.length
    },
    platforms_to_remove: toRemove.map(p => ({
      name: p.name,
      url: p.url || p.website,
      reason: p.check_result.status,
      error: p.check_result.error
    })),
    suspicious_redirects: results.redirected.map(p => ({
      name: p.name,
      original_url: p.url || p.website,
      final_url: p.check_result.finalUrl
    }))
  };

  writeFileSync(CONFIG.dead_urls_report, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: DEAD_URLS_REPORT.json`);

  // Auto-remove if requested
  if (CONFIG.auto_remove && toRemove.length > 0) {
    console.log(`\n🗑️  Removing ${toRemove.length} dead/fake platforms...`);

    const removeIds = new Set(toRemove.map(p => p.id));
    const cleanedPlatforms = platforms.filter(p => !removeIds.has(p.id));

    writeFileSync(CONFIG.platforms_path, JSON.stringify(cleanedPlatforms, null, 2));
    console.log(`✅ Removed ${toRemove.length} platforms`);
    console.log(`📊 Platforms remaining: ${cleanedPlatforms.length}`);
  } else if (toRemove.length > 0) {
    console.log(`\nℹ️  Run with --remove flag to automatically remove dead platforms`);
  }

  console.log('\n✅ URL validation complete!\n');
}

main().catch(console.error);
