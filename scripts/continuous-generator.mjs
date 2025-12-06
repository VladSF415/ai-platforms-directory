#!/usr/bin/env node

/**
 * Continuous Content Generator
 *
 * Runs all DeepSeek-powered scripts in a loop until credits run out.
 * Automatically discovers platforms, generates pillar content, comparisons,
 * alternatives, and best-of pages.
 *
 * Usage:
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/continuous-generator.mjs
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  delay_between_tasks: 3000,      // 3 seconds between tasks
  delay_between_cycles: 30000,    // 30 seconds between full cycles
  max_retries: 3,                 // Retry failed tasks
  stats_file: join(__dirname, '../generation-stats.json')
};

// Track statistics
let stats = {
  started: new Date().toISOString(),
  cycles_completed: 0,
  platforms_discovered: 0,
  pillar_pages_generated: 0,
  comparisons_generated: 0,
  alternatives_generated: 0,
  bestof_generated: 0,
  api_calls: 0,
  errors: [],
  credits_exhausted: false,
  last_update: new Date().toISOString()
};

// Load existing stats if available
if (existsSync(CONFIG.stats_file)) {
  try {
    stats = JSON.parse(readFileSync(CONFIG.stats_file, 'utf-8'));
    stats.resumed = new Date().toISOString();
    console.log('📊 Resuming from previous session');
  } catch (e) {
    console.log('📊 Starting fresh session');
  }
}

function saveStats() {
  stats.last_update = new Date().toISOString();
  writeFileSync(CONFIG.stats_file, JSON.stringify(stats, null, 2));
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    money: '💰',
    rocket: '🚀',
    cycle: '🔄'
  };
  console.log(`[${timestamp}] ${icons[type] || ''} ${message}`);
}

// Check if credits are exhausted based on error message
function isCreditsExhausted(error) {
  const creditErrors = [
    'insufficient_quota',
    'rate_limit',
    'billing',
    'credit',
    'quota exceeded',
    'payment required',
    '402',
    '429'
  ];
  const errorStr = String(error).toLowerCase();
  return creditErrors.some(e => errorStr.includes(e));
}

// Run a script and return result
function runScript(scriptPath, args = []) {
  return new Promise((resolve) => {
    const scriptName = scriptPath.split('/').pop();
    log(`Running: ${scriptName} ${args.join(' ')}`, 'info');

    const child = spawn('node', [scriptPath, ...args], {
      cwd: join(__dirname, '..'),
      env: { ...process.env, DEEPSEEK_API_KEY: CONFIG.deepseek_api_key },
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      stats.api_calls++;

      if (isCreditsExhausted(stderr) || isCreditsExhausted(stdout)) {
        stats.credits_exhausted = true;
        saveStats();
        resolve({ success: false, credits_exhausted: true });
      } else if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        stats.errors.push({
          script: scriptName,
          time: new Date().toISOString(),
          error: stderr || `Exit code: ${code}`
        });
        saveStats();
        resolve({ success: false, error: stderr });
      }
    });

    child.on('error', (error) => {
      stats.errors.push({
        script: scriptName,
        time: new Date().toISOString(),
        error: error.message
      });
      saveStats();
      resolve({ success: false, error: error.message });
    });
  });
}

// Get categories that don't have pillar content yet
function getMissingPillarCategories() {
  const pillarDir = join(__dirname, '../pillar-content');
  const existingPillars = existsSync(pillarDir)
    ? readdirSync(pillarDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
    : [];

  const allCategories = [
    'code-ai', 'llms', 'generative-ai', 'computer-vision', 'nlp',
    'image-generation', 'video-ai', 'ml-frameworks', 'analytics-bi',
    'agent-platforms', 'data-governance', 'video-generation',
    'website-ai', 'workflow-automation', 'audio-ai', 'search-ai',
    'document-ai', 'robotics-ai', 'healthcare-ai', 'finance-ai',
    'marketing-ai', 'sales-ai', 'customer-service-ai', 'legal-ai',
    'education-ai', 'security-ai', 'hr-ai', 'ecommerce-ai'
  ];

  return allCategories.filter(c =>
    !existingPillars.some(p => p.includes(c))
  );
}

// Main task definitions - ALL use DeepSeek AI
const TASKS = [
  {
    name: 'Discover New Platforms',
    script: 'scripts/ai-powered-organizer.mjs',
    args: ['--discover', '--auto-add', '--max=15', '--provider=deepseek'],
    onSuccess: () => { stats.platforms_discovered += 15; }
  },
  {
    name: 'Enrich Platform Data',
    script: 'scripts/ai-powered-organizer.mjs',
    args: ['--enrich', '--provider=deepseek'],
    frequency: 2  // Run every 2nd cycle
  },
  {
    name: 'Generate Pillar Content',
    script: 'scripts/generate-pillar-content.mjs',
    getDynamicArgs: () => {
      const missing = getMissingPillarCategories();
      if (missing.length > 0) {
        return ['--category', missing[0]];
      }
      // Pick random category for refresh
      const cats = ['code-ai', 'llms', 'generative-ai', 'video-ai', 'agent-platforms',
                    'image-generation', 'nlp', 'analytics-bi', 'workflow-automation'];
      return ['--category', cats[Math.floor(Math.random() * cats.length)]];
    },
    onSuccess: () => { stats.pillar_pages_generated++; }
  },
  {
    name: 'AI Comparisons',
    script: 'scripts/ai-comparison-generator.mjs',
    args: ['--count=5'],
    onSuccess: () => { stats.comparisons_generated += 5; }
  },
  {
    name: 'AI Alternatives',
    script: 'scripts/ai-alternatives-generator.mjs',
    args: ['--count=5'],
    onSuccess: () => { stats.alternatives_generated += 5; }
  },
  {
    name: 'Template Comparisons',
    script: 'scripts/generate-more-comparisons.mjs',
    args: ['--target=20'],
    onSuccess: () => { stats.comparisons_generated += 20; },
    frequency: 3  // Less frequent - uses templates not AI
  },
  {
    name: 'Template Alternatives',
    script: 'scripts/generate-alternatives-pages.mjs',
    args: ['--limit=20'],
    onSuccess: () => { stats.alternatives_generated += 20; },
    frequency: 3
  },
  {
    name: 'Best-Of Lists',
    script: 'scripts/generate-bestof-pages.mjs',
    args: ['--count=5'],
    onSuccess: () => { stats.bestof_generated += 5; },
    frequency: 2
  }
];

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run a single cycle
async function runCycle() {
  log(`Starting Cycle #${stats.cycles_completed + 1}`, 'cycle');

  for (const task of TASKS) {
    // Check frequency (some tasks run less often)
    if (task.frequency && (stats.cycles_completed % task.frequency !== 0)) {
      log(`Skipping ${task.name} (runs every ${task.frequency} cycles)`, 'info');
      continue;
    }

    // Check if credits are exhausted
    if (stats.credits_exhausted) {
      return false;
    }

    const args = task.getDynamicArgs ? task.getDynamicArgs() : (task.args || []);
    const result = await runScript(task.script, args);

    if (result.credits_exhausted) {
      log('Credits exhausted! Stopping...', 'money');
      return false;
    }

    if (result.success && task.onSuccess) {
      task.onSuccess();
    }

    saveStats();

    // Delay between tasks
    log(`Waiting ${CONFIG.delay_between_tasks / 1000}s before next task...`, 'info');
    await sleep(CONFIG.delay_between_tasks);
  }

  stats.cycles_completed++;
  saveStats();
  return true;
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Started:              ${stats.started}`);
  console.log(`Cycles Completed:     ${stats.cycles_completed}`);
  console.log(`API Calls Made:       ${stats.api_calls}`);
  console.log(`Platforms Discovered: ${stats.platforms_discovered}`);
  console.log(`Pillar Pages:         ${stats.pillar_pages_generated}`);
  console.log(`Comparisons:          ${stats.comparisons_generated}`);
  console.log(`Alternatives:         ${stats.alternatives_generated}`);
  console.log(`Best-Of Pages:        ${stats.bestof_generated}`);
  console.log(`Errors:               ${stats.errors.length}`);
  console.log(`Credits Exhausted:    ${stats.credits_exhausted ? 'YES' : 'No'}`);
  console.log('='.repeat(60));
  console.log(`\n📁 Stats saved to: generation-stats.json\n`);
}

// Main loop
async function main() {
  if (!CONFIG.deepseek_api_key) {
    console.error('❌ DEEPSEEK_API_KEY environment variable not set!');
    console.log('\nUsage:');
    console.log('  DEEPSEEK_API_KEY="sk-xxx" node scripts/continuous-generator.mjs');
    process.exit(1);
  }

  log('🚀 Continuous Content Generator Started', 'rocket');
  log(`DeepSeek API Key: ${CONFIG.deepseek_api_key.slice(0, 10)}...`, 'info');
  log('Press Ctrl+C to stop manually\n', 'info');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nShutting down gracefully...', 'warning');
    printSummary();
    process.exit(0);
  });

  // Main loop - runs until credits exhausted
  while (!stats.credits_exhausted) {
    const shouldContinue = await runCycle();

    if (!shouldContinue) {
      break;
    }

    log(`Cycle ${stats.cycles_completed} complete. Waiting ${CONFIG.delay_between_cycles / 1000}s before next cycle...`, 'success');
    await sleep(CONFIG.delay_between_cycles);
  }

  printSummary();

  if (stats.credits_exhausted) {
    log('Credits exhausted. Generator stopped.', 'money');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  printSummary();
  process.exit(1);
});
