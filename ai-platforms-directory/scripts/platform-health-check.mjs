#!/usr/bin/env node
/**
 * Platform Health Monitor
 *
 * Checks platform health:
 * - URL availability (404s, dead links)
 * - Detect shutdowns/rebrandings
 * - Monitor major updates
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  health_report_path: join(__dirname, '../platform-health-report.json'),
  check_all: process.argv.includes('--all'),
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

// Check URL health
async function checkURL(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIDirectoryBot/1.0)'
      },
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    return {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      finalUrl: response.url,
      error: null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { status: 0, ok: false, error: 'Timeout' };
    }
    return { status: 0, ok: false, error: error.message };
  }
}

// Main
async function main() {
  console.log('🏥 PLATFORM HEALTH MONITOR\n');

  const toCheck = CONFIG.check_all
    ? platforms.filter(p => p.url || p.website)
    : platforms
        .filter(p => (p.url || p.website) && (p.featured || parseFloat(p.rating) >= 4.0))
        .slice(0, 100); // Check top 100 by default

  console.log(`Checking ${toCheck.length} platform URLs...\n`);

  const results = {
    timestamp: new Date().toISOString(),
    total_checked: toCheck.length,
    healthy: [],
    warnings: [],
    errors: [],
    dead: [],
  };

  for (let i = 0; i < toCheck.length; i++) {
    const platform = toCheck[i];
    const url = platform.url || platform.website;

    if (!url) continue;

    process.stdout.write(`[${i + 1}/${toCheck.length}] ${platform.name.padEnd(40)} `);

    const health = await checkURL(url);

    const result = {
      platform_id: platform.id,
      platform_name: platform.name,
      url: url,
      status: health.status,
      ...health
    };

    if (health.ok) {
      if (health.redirected) {
        console.log(`⚠️  REDIRECT (${health.status}) → ${health.finalUrl}`);
        results.warnings.push({
          ...result,
          issue: 'redirected',
          message: `Redirects to ${health.finalUrl}`
        });
      } else {
        console.log(`✅ OK (${health.status})`);
        results.healthy.push(result);
      }
    } else if (health.status === 404) {
      console.log(`❌ NOT FOUND (404)`);
      results.dead.push({
        ...result,
        issue: 'not_found',
        message: 'Page not found - platform may be shut down'
      });
    } else if (health.status === 403 || health.status === 401) {
      console.log(`⚠️  ACCESS DENIED (${health.status})`);
      results.warnings.push({
        ...result,
        issue: 'access_denied',
        message: 'Access denied - may be blocking bots or requires auth'
      });
    } else if (health.status >= 500) {
      console.log(`⚠️  SERVER ERROR (${health.status})`);
      results.errors.push({
        ...result,
        issue: 'server_error',
        message: 'Server error - temporary or platform issues'
      });
    } else {
      console.log(`❌ ERROR: ${health.error || 'Unknown'}`);
      results.errors.push({
        ...result,
        issue: 'error',
        message: health.error || 'Unknown error'
      });
    }

    // Small delay to avoid hammering servers
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate report
  console.log('\n\n📊 HEALTH REPORT\n');
  console.log(`Total checked: ${results.total_checked}`);
  console.log(`✅ Healthy: ${results.healthy.length} (${((results.healthy.length / results.total_checked) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Warnings: ${results.warnings.length} (${((results.warnings.length / results.total_checked) * 100).toFixed(1)}%)`);
  console.log(`❌ Errors: ${results.errors.length} (${((results.errors.length / results.total_checked) * 100).toFixed(1)}%)`);
  console.log(`💀 Dead links: ${results.dead.length} (${((results.dead.length / results.total_checked) * 100).toFixed(1)}%)\n`);

  if (results.dead.length > 0) {
    console.log('💀 DEAD PLATFORMS (need removal or URL update):\n');
    results.dead.forEach(p => {
      console.log(`  - ${p.platform_name}`);
      console.log(`    URL: ${p.url}`);
      console.log(`    Status: ${p.status}`);
      console.log('');
    });
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS (need review):\n');
    results.warnings.forEach(p => {
      console.log(`  - ${p.platform_name}: ${p.message}`);
    });
    console.log('');
  }

  // Save report
  if (!CONFIG.dry_run) {
    writeFileSync(CONFIG.health_report_path, JSON.stringify(results, null, 2));
    console.log(`✅ Saved detailed report to: ${CONFIG.health_report_path}`);

    // Flag problematic platforms in platforms.json
    if (results.dead.length > 0 || results.errors.length > 0) {
      platforms.forEach(p => {
        const dead = results.dead.find(d => d.platform_id === p.id);
        const error = results.errors.find(e => e.platform_id === p.id);

        if (dead) {
          p.health_status = 'dead';
          p.health_checked_at = new Date().toISOString();
        } else if (error) {
          p.health_status = 'error';
          p.health_checked_at = new Date().toISOString();
        }
      });

      writeFileSync(CONFIG.platforms_path, JSON.stringify(platforms, null, 2));
      console.log(`✅ Updated platforms.json with health status`);
    }
  }

  console.log('\n🎉 Health check complete!');

  // Exit with error code if critical issues found
  if (results.dead.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
