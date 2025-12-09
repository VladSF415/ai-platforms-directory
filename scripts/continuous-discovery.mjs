#!/usr/bin/env node
/**
 * Continuous Discovery Mode
 *
 * Runs mass discovery continuously throughout the day
 * Target: 2000-3000+ platforms per day
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  platforms_path: join(__dirname, '../platforms.json'),
  state_path: join(__dirname, '../.continuous-discovery-state.json'),
  log_path: join(__dirname, '../continuous-discovery.log'),

  // AGGRESSIVE DISCOVERY SETTINGS
  runs_per_day: parseInt(process.argv.find(arg => arg.startsWith('--runs='))?.split('=')[1]) || 6, // Every 4 hours
  platforms_per_run: parseInt(process.argv.find(arg => arg.startsWith('--per-run='))?.split('=')[1]) || 500,
  batches: 10, // 10 batches per run
  batch_size: 50, // 50 platforms per batch
  workers: 3, // 3 parallel workers

  // Daily target
  target_per_day: parseInt(process.argv.find(arg => arg.startsWith('--target='))?.split('=')[1]) || 3000,

  continuous: process.argv.includes('--continuous'), // Run forever
  interval_hours: parseFloat(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 4,
};

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(message);

  try {
    const existing = existsSync(CONFIG.log_path) ? readFileSync(CONFIG.log_path, 'utf-8') : '';
    writeFileSync(CONFIG.log_path, existing + logLine);
  } catch (error) {
    console.error('Log write failed:', error);
  }
}

function loadState() {
  if (existsSync(CONFIG.state_path)) {
    return JSON.parse(readFileSync(CONFIG.state_path, 'utf-8'));
  }
  return {
    runs_today: 0,
    platforms_added_today: 0,
    last_run: null,
    last_reset: new Date().toISOString().split('T')[0],
    total_runs: 0,
    total_platforms_added: 0
  };
}

function saveState(state) {
  writeFileSync(CONFIG.state_path, JSON.stringify(state, null, 2));
}

function resetDailyStats(state) {
  const today = new Date().toISOString().split('T')[0];
  if (state.last_reset !== today) {
    log(`\n📅 New day! Resetting daily stats...`);
    log(`   Yesterday: ${state.runs_today} runs, ${state.platforms_added_today} platforms added`);
    state.runs_today = 0;
    state.platforms_added_today = 0;
    state.last_reset = today;
    saveState(state);
  }
}

async function runDiscovery(state) {
  log('\n═══════════════════════════════════════════════════════════');
  log(`🚀 CONTINUOUS DISCOVERY RUN #${state.runs_today + 1} (Total: ${state.total_runs + 1})`);
  log('═══════════════════════════════════════════════════════════');

  const beforeCount = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8')).length;
  log(`   Current platforms: ${beforeCount}`);
  log(`   Target for today: ${CONFIG.target_per_day}`);
  log(`   Added today so far: ${state.platforms_added_today}`);
  log(`   Remaining today: ${CONFIG.target_per_day - state.platforms_added_today}`);

  const startTime = Date.now();

  try {
    log(`\n🔄 Running mass-discovery.mjs...`);
    log(`   Batch size: ${CONFIG.batch_size}`);
    log(`   Batches: ${CONFIG.batches}`);
    log(`   Workers: ${CONFIG.workers}`);
    log(`   Target: ~${CONFIG.platforms_per_run} platforms\n`);

    const cmd = `node ${join(__dirname, 'mass-discovery.mjs')} --batch=${CONFIG.batch_size} --batches=${CONFIG.batches} --workers=${CONFIG.workers}`;

    const output = execSync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024, // 20MB
      timeout: 60 * 60 * 1000 // 1 hour timeout
    });

    const afterCount = JSON.parse(readFileSync(CONFIG.platforms_path, 'utf-8')).length;
    const added = afterCount - beforeCount;
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    log(`\n✅ Discovery complete!`);
    log(`   Platforms added: ${added}`);
    log(`   New total: ${afterCount}`);
    log(`   Duration: ${duration} minutes`);
    log(`   Rate: ${(added / parseFloat(duration)).toFixed(1)} platforms/min`);

    // Update state
    state.runs_today++;
    state.platforms_added_today += added;
    state.total_runs++;
    state.total_platforms_added += added;
    state.last_run = new Date().toISOString();
    saveState(state);

    // Auto-commit and push
    await commitAndDeploy(added, afterCount);

    return { success: true, added, duration };

  } catch (error) {
    log(`\n❌ Discovery failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function commitAndDeploy(added, total) {
  log('\n📦 Auto-committing changes...');

  try {
    execSync('git add platforms.json MASS_DISCOVERY_REPORT.md', { encoding: 'utf-8' });

    const commitMsg = `Continuous discovery: +${added} platforms (total: ${total})

Automated mass discovery run
- Added: ${added} new platforms
- Total: ${total} platforms
- Timestamp: ${new Date().toISOString()}

🤖 Generated with [Claude Code](https://claude.com/claude-code) - Continuous Discovery

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`;

    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    log('   ✅ Committed');

    execSync('git push origin master', { encoding: 'utf-8' });
    log('   ✅ Pushed to GitHub - Railway auto-deploying');

  } catch (error) {
    log(`   ⚠️  Git operation failed: ${error.message}`);
  }
}

async function sleep(hours) {
  log(`\n⏸️  Sleeping for ${hours} hours until next run...`);
  log(`   Next run at: ${new Date(Date.now() + hours * 60 * 60 * 1000).toLocaleString()}\n`);
  await new Promise(resolve => setTimeout(resolve, hours * 60 * 60 * 1000));
}

async function main() {
  log('\n');
  log('╔═══════════════════════════════════════════════════════════╗');
  log('║   CONTINUOUS DISCOVERY MODE - ULTRA HIGH VOLUME           ║');
  log('╚═══════════════════════════════════════════════════════════╝');
  log('');
  log('⚙️  Configuration:');
  log(`   Runs per day: ${CONFIG.runs_per_day}`);
  log(`   Platforms per run: ~${CONFIG.platforms_per_run}`);
  log(`   Daily target: ${CONFIG.target_per_day} platforms`);
  log(`   Interval: ${CONFIG.interval_hours} hours`);
  log(`   Continuous mode: ${CONFIG.continuous ? 'YES (runs forever)' : 'NO (single run)'}`);

  const state = loadState();
  resetDailyStats(state);

  log('\n📊 Current Stats:');
  log(`   Runs today: ${state.runs_today}`);
  log(`   Platforms added today: ${state.platforms_added_today}`);
  log(`   All-time runs: ${state.total_runs}`);
  log(`   All-time platforms: ${state.total_platforms_added}`);

  if (CONFIG.continuous) {
    log('\n🔄 Starting continuous mode...\n');

    while (true) {
      resetDailyStats(state);

      // Check if we've hit daily target
      if (state.platforms_added_today >= CONFIG.target_per_day) {
        log(`\n🎯 Daily target reached! (${state.platforms_added_today}/${CONFIG.target_per_day})`);
        log(`   Waiting until tomorrow...`);

        // Sleep until midnight + 1 hour
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(1, 0, 0, 0);
        const hoursUntilTomorrow = (tomorrow - now) / (1000 * 60 * 60);

        await sleep(hoursUntilTomorrow);
        continue;
      }

      // Run discovery
      await runDiscovery(state);

      // Wait for next run
      await sleep(CONFIG.interval_hours);
    }
  } else {
    // Single run mode
    log('\n▶️  Single run mode\n');
    await runDiscovery(state);

    log('\n═══════════════════════════════════════════════════════════');
    log('📊 SESSION SUMMARY');
    log('═══════════════════════════════════════════════════════════');
    log(`Today's runs: ${state.runs_today}`);
    log(`Today's platforms: ${state.platforms_added_today}`);
    log(`Progress: ${((state.platforms_added_today / CONFIG.target_per_day) * 100).toFixed(1)}% of daily target`);
    log('');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n⏹️  Shutting down gracefully...');
  const state = loadState();
  log(`📊 Final Stats:`);
  log(`   Runs today: ${state.runs_today}`);
  log(`   Platforms added today: ${state.platforms_added_today}`);
  log(`   All-time total: ${state.total_platforms_added}`);
  log('\n👋 Goodbye!\n');
  process.exit(0);
});

main().catch(error => {
  log(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});
