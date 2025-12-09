#!/usr/bin/env node
/**
 * Autonomous Orchestrator
 *
 * Master scheduler that runs all autonomous tasks
 * Can be scheduled via cron/Task Scheduler
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  state_path: join(__dirname, '../.autonomous-state.json'),
  platforms_path: join(__dirname, '../platforms.json'),
  log_path: join(__dirname, '../autonomous-runs.log'),
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,

  // Task configurations
  tasks: {
    mass_discover: {
      name: 'Mass Platform Discovery',
      script: 'mass-discovery.mjs',
      args: '--batch=15 --batches=12 --workers=3', // 180 platforms per run!
      frequency: 'daily',
      enabled: true
    },
    discover: {
      name: 'Platform Discovery (Standard)',
      script: 'ai-powered-organizer.mjs',
      args: '--discover --auto-add --max=10 --provider=deepseek',
      frequency: 'daily',
      enabled: false // Disabled in favor of mass_discover
    },
    enrich: {
      name: 'Data Enrichment',
      script: 'data-enrichment.mjs',
      args: '--max=20',
      frequency: 'daily',
      enabled: true
    },
    affiliate: {
      name: 'Affiliate Hunter',
      script: 'affiliate-hunter.mjs',
      args: '',
      frequency: 'weekly', // Run once per week
      enabled: true
    },
    health: {
      name: 'Health Check',
      script: 'platform-health-check.mjs',
      args: '',
      frequency: 'daily',
      enabled: true
    },
    blog: {
      name: 'Blog Generation',
      script: 'blog-generator.mjs',
      args: '--num=2 --type=category',
      frequency: 'weekly',
      enabled: true
    },
    recategorize: {
      name: 'Smart Recategorization',
      script: 'ai-powered-organizer.mjs',
      args: '--recategorize --recat-max=30 --provider=deepseek',
      frequency: 'weekly',
      enabled: true
    },
    url_validation: {
      name: 'URL Validation & Cleanup',
      script: 'validate-urls.mjs',
      args: '--remove', // Auto-remove dead URLs
      frequency: 'weekly', // Run once per week to clean up
      enabled: true
    }
  }
};

// Load state
function loadState() {
  if (existsSync(CONFIG.state_path)) {
    return JSON.parse(readFileSync(CONFIG.state_path, 'utf-8'));
  }

  return {
    last_runs: {},
    stats: {
      total_runs: 0,
      successful_runs: 0,
      failed_runs: 0
    }
  };
}

// Save state
function saveState(state) {
  writeFileSync(CONFIG.state_path, JSON.stringify(state, null, 2));
}

// Log message
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  console.log(message);

  try {
    const existingLog = existsSync(CONFIG.log_path) ? readFileSync(CONFIG.log_path, 'utf-8') : '';
    writeFileSync(CONFIG.log_path, existingLog + logLine);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

// Check if task should run
function shouldRun(taskId, task, state) {
  if (!task.enabled) return false;

  const lastRun = state.last_runs[taskId];
  if (!lastRun) return true; // Never run before

  const lastRunDate = new Date(lastRun);
  const now = new Date();
  const hoursSinceLastRun = (now - lastRunDate) / (1000 * 60 * 60);

  if (task.frequency === 'daily') {
    return hoursSinceLastRun >= 24;
  } else if (task.frequency === 'weekly') {
    return hoursSinceLastRun >= 168; // 7 days
  } else if (task.frequency === 'hourly') {
    return hoursSinceLastRun >= 1;
  }

  return false;
}

// Run a task
async function runTask(taskId, task) {
  log(`\n🚀 Starting task: ${task.name}`);
  log(`   Script: ${task.script} ${task.args}`);

  const startTime = Date.now();

  try {
    const cmd = `node ${join(__dirname, task.script)} ${task.args}`;
    const output = execSync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30 * 60 * 1000 // 30 minute timeout
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ Completed: ${task.name} (${duration}s)`);

    return { success: true, output, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ Failed: ${task.name} (${duration}s)`);
    log(`   Error: ${error.message}`);

    return { success: false, error: error.message, duration };
  }
}

// Commit and deploy changes
async function commitAndDeploy(tasksRun) {
  log('\n📦 Checking for changes to commit...');

  try {
    // Check if there are changes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });

    if (!status.trim()) {
      log('   No changes to commit');
      return;
    }

    log('   Changes detected, creating commit...');

    // Stage platforms.json and any generated files
    execSync('git add platforms.json blog-posts/ affiliate-opportunities.json AFFILIATE_OPPORTUNITIES.md', {
      encoding: 'utf-8'
    });

    // Create commit message
    const taskNames = tasksRun.map(t => t.name).join(', ');
    const commitMsg = `Autonomous update: ${taskNames}

${tasksRun.map(t => `- ${t.name}: ${t.success ? 'Success' : 'Failed'}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.com/claude-code) - Autonomous Pipeline

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`;

    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });

    log('   ✅ Committed changes');

    // Push to GitHub (which triggers Railway auto-deploy)
    execSync('git push origin master', { encoding: 'utf-8' });

    log('   ✅ Pushed to GitHub - Railway will auto-deploy');

    return true;
  } catch (error) {
    log(`   ⚠️  Git operation failed: ${error.message}`);
    return false;
  }
}

// Main orchestrator
async function main() {
  log('═══════════════════════════════════════════════════════════');
  log('🤖 AUTONOMOUS ORCHESTRATOR - Starting');
  log('═══════════════════════════════════════════════════════════');

  // Check API key
  if (!CONFIG.deepseek_api_key) {
    log('❌ DEEPSEEK_API_KEY not set - skipping AI tasks');
    process.exit(1);
  }

  const state = loadState();
  const tasksRun = [];

  // Check and run each task
  for (const [taskId, task] of Object.entries(CONFIG.tasks)) {
    if (shouldRun(taskId, task, state)) {
      const result = await runTask(taskId, task);

      tasksRun.push({
        id: taskId,
        name: task.name,
        ...result
      });

      // Update state
      if (result.success) {
        state.last_runs[taskId] = new Date().toISOString();
        state.stats.successful_runs++;
      } else {
        state.stats.failed_runs++;
      }

      state.stats.total_runs++;
      saveState(state);

      // Small delay between tasks
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      const lastRun = state.last_runs[taskId];
      const hoursAgo = lastRun
        ? ((new Date() - new Date(lastRun)) / (1000 * 60 * 60)).toFixed(1)
        : 'never';

      log(`⏭️  Skipping: ${task.name} (last run: ${hoursAgo === 'never' ? 'never' : hoursAgo + 'h ago'})`);
    }
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════');
  log('📊 ORCHESTRATOR SUMMARY');
  log('═══════════════════════════════════════════════════════════');
  log(`Tasks run: ${tasksRun.length}`);
  log(`Successful: ${tasksRun.filter(t => t.success).length}`);
  log(`Failed: ${tasksRun.filter(t => !t.success).length}`);
  log(`\nAll-time stats:`);
  log(`  Total runs: ${state.stats.total_runs}`);
  log(`  Success rate: ${((state.stats.successful_runs / state.stats.total_runs) * 100).toFixed(1)}%`);

  // If tasks were run and successful, commit and deploy
  if (tasksRun.length > 0 && tasksRun.some(t => t.success)) {
    await commitAndDeploy(tasksRun);
  }

  log('\n🎉 Orchestrator complete!');
  log('═══════════════════════════════════════════════════════════\n');
}

main().catch(error => {
  log(`❌ Orchestrator failed: ${error.message}`);
  process.exit(1);
});
