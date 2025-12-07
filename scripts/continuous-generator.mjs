#!/usr/bin/env node

/**
 * Continuous Content Generator
 *
 * Runs all DeepSeek-powered scripts in a loop until credits run out.
 * Automatically discovers platforms, generates pillar content, comparisons,
 * alternatives, and best-of pages.
 *
 * Auto-syncs all changes to GitHub after each cycle.
 *
 * Usage:
 *   DEEPSEEK_API_KEY="sk-xxx" node scripts/continuous-generator.mjs
 *
 * Required env vars for git sync:
 *   GITHUB_TOKEN - Personal access token with repo permissions
 */

import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  deepseek_api_key: process.env.DEEPSEEK_API_KEY,
  github_token: process.env.GITHUB_TOKEN,
  delay_between_tasks: 3000,      // 3 seconds between tasks
  delay_between_cycles: 30000,    // 30 seconds between full cycles
  max_retries: 3,                 // Retry failed tasks
  stats_file: join(__dirname, '../generation-stats.json'),
  repo_dir: join(__dirname, '..')
};

// Track statistics
let stats = {
  started: new Date().toISOString(),
  cycles_completed: 0,
  platforms_discovered: 0,
  platforms_recategorized: 0,
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

// Get all categories dynamically from platforms.json
function getAllCategoriesFromPlatforms() {
  try {
    const platformsPath = join(__dirname, '../platforms.json');
    const platforms = JSON.parse(readFileSync(platformsPath, 'utf-8'));
    const categories = [...new Set(platforms.map(p => p.category).filter(Boolean))];
    return categories.sort();
  } catch (error) {
    log(`Failed to load categories: ${error.message}`, 'error');
    return [];
  }
}

// Get categories that don't have pillar content yet
function getMissingPillarCategories() {
  const pillarDir = join(__dirname, '../pillar-content');
  const existingPillars = existsSync(pillarDir)
    ? readdirSync(pillarDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
    : [];

  // Dynamically discover ALL categories from platforms.json
  const allCategories = getAllCategoriesFromPlatforms();

  log(`Found ${allCategories.length} categories in platforms.json`, 'info');

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
    name: 'Recategorize Platforms',
    script: 'scripts/ai-powered-organizer.mjs',
    args: ['--recategorize', '--recat-max=20', '--provider=deepseek'],
    onSuccess: () => { stats.platforms_recategorized = (stats.platforms_recategorized || 0) + 20; },
    frequency: 3  // Run every 3rd cycle
  },
  {
    name: 'Generate Pillar Content',
    script: 'scripts/generate-pillar-content.mjs',
    getDynamicArgs: () => {
      const missing = getMissingPillarCategories();
      if (missing.length > 0) {
        log(`Missing pillar content for: ${missing[0]}`, 'info');
        return ['--category', missing[0]];
      }
      // Pick random category for refresh (dynamically from platforms.json)
      const allCategories = getAllCategoriesFromPlatforms();
      if (allCategories.length > 0) {
        const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
        log(`Refreshing pillar content for: ${randomCat}`, 'info');
        return ['--category', randomCat];
      }
      return ['--category', 'llms']; // Fallback
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
  console.log(`Platforms Recategorized: ${stats.platforms_recategorized || 0}`);
  console.log(`Pillar Pages:         ${stats.pillar_pages_generated}`);
  console.log(`Comparisons:          ${stats.comparisons_generated}`);
  console.log(`Alternatives:         ${stats.alternatives_generated}`);
  console.log(`Best-Of Pages:        ${stats.bestof_generated}`);
  console.log(`Errors:               ${stats.errors.length}`);
  console.log(`Credits Exhausted:    ${stats.credits_exhausted ? 'YES' : 'No'}`);
  console.log(`Git Syncs:            ${stats.git_syncs || 0}`);
  console.log('='.repeat(60));
  console.log(`\n📁 Stats saved to: generation-stats.json\n`);
}

// Git sync - commit and push all changes to GitHub
async function syncToGitHub() {
  if (!CONFIG.github_token) {
    log('GITHUB_TOKEN not set, skipping git sync', 'warning');
    return false;
  }

  log('📤 Syncing changes to GitHub...', 'info');

  const execOptions = {
    cwd: CONFIG.repo_dir,
    encoding: 'utf-8',
    stdio: 'pipe'
  };

  try {
    // First check if git is available
    try {
      const gitVersion = execSync('git --version', execOptions).toString().trim();
      log(`Git available: ${gitVersion}`, 'info');
    } catch (e) {
      log('Git is NOT installed in this container!', 'error');
      stats.errors.push({ type: 'git_sync', time: new Date().toISOString(), error: 'Git not installed' });
      saveStats();
      return false;
    }

    // Check if .git directory exists
    try {
      execSync('git rev-parse --git-dir', execOptions);
    } catch (e) {
      log('.git directory not found - not a git repository!', 'error');
      stats.errors.push({ type: 'git_sync', time: new Date().toISOString(), error: 'Not a git repository' });
      saveStats();
      return false;
    }

    // Configure git
    execSync('git config user.email "ai-generator@aiplatformslist.com"', execOptions);
    execSync('git config user.name "AI Content Generator"', execOptions);
    log('Git user configured', 'info');

    // Set remote URL with token for authentication
    const repoUrl = `https://x-access-token:${CONFIG.github_token}@github.com/VladSF415/ai-platforms-directory.git`;
    execSync(`git remote set-url origin "${repoUrl}"`, execOptions);
    log('Remote URL configured with token', 'info');

    // Pull latest changes first to avoid conflicts
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', execOptions).toString().trim();
      log(`Current branch: ${branch}`, 'info');
      execSync(`git pull origin ${branch} --rebase`, execOptions);
      log('Pulled latest changes', 'info');
    } catch (e) {
      log(`Pull warning: ${e.message}`, 'warning');
    }

    // Check for changes
    const status = execSync('git status --porcelain', execOptions).toString().trim();
    log(`Git status: ${status ? status.split('\n').length + ' changed files' : 'no changes'}`, 'info');

    if (!status) {
      log('No changes to commit', 'info');
      return true;
    }

    // Stage all content files
    const filesToAdd = [
      'platforms.json',
      'affiliate-opportunities.md',
      'generation-stats.json',
      'pillar-content/',
      'comparison-content/',
      'alternatives-content/',
      'bestof-content/'
    ];

    for (const file of filesToAdd) {
      try {
        execSync(`git add ${file}`, execOptions);
      } catch (e) {
        // File might not exist yet - that's ok
      }
    }

    // Check if there are staged changes
    const stagedStatus = execSync('git diff --cached --name-only', execOptions).toString().trim();

    if (!stagedStatus) {
      log('No staged changes to commit', 'info');
      return true;
    }

    // Count changes
    const changedFiles = stagedStatus.split('\n').filter(f => f).length;
    log(`Staged ${changedFiles} files for commit`, 'info');

    // Commit with single-line message (avoid shell escaping issues with newlines)
    const commitMsg = `Auto-generated content Cycle ${stats.cycles_completed} - Platforms:${stats.platforms_discovered} Comparisons:${stats.comparisons_generated}`;
    execSync(`git commit -m "${commitMsg}"`, execOptions);
    log(`Committed ${changedFiles} files`, 'success');

    // Push - detect the branch dynamically
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', execOptions).toString().trim();
    log(`Pushing to origin/${currentBranch}...`, 'info');

    const pushOutput = execSync(`git push origin ${currentBranch} 2>&1`, execOptions).toString();
    log(`Push output: ${pushOutput || 'Success'}`, 'info');
    log('Pushed to GitHub successfully!', 'success');

    stats.git_syncs = (stats.git_syncs || 0) + 1;
    stats.last_git_sync = new Date().toISOString();
    saveStats();

    return true;

  } catch (error) {
    log(`Git sync failed: ${error.message}`, 'error');
    if (error.stderr) {
      log(`Git stderr: ${error.stderr}`, 'error');
    }
    if (error.stdout) {
      log(`Git stdout: ${error.stdout}`, 'error');
    }
    stats.errors.push({
      type: 'git_sync',
      time: new Date().toISOString(),
      error: error.message,
      stderr: error.stderr,
      stdout: error.stdout
    });
    saveStats();
    return false;
  }
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
  process.on('SIGINT', async () => {
    log('\nShutting down gracefully...', 'warning');
    await syncToGitHub();
    printSummary();
    process.exit(0);
  });

  // Main loop - runs until credits exhausted
  while (!stats.credits_exhausted) {
    const shouldContinue = await runCycle();

    if (!shouldContinue) {
      break;
    }

    log(`Cycle ${stats.cycles_completed} complete.`, 'success');

    // Sync to GitHub after each cycle
    await syncToGitHub();

    log(`Waiting ${CONFIG.delay_between_cycles / 1000}s before next cycle...`, 'info');
    await sleep(CONFIG.delay_between_cycles);
  }

  // Final sync before exit
  await syncToGitHub();

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
