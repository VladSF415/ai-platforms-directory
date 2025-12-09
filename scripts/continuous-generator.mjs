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
  github_repo: 'VladSF415/ai-platforms-directory',
  delay_between_tasks: 3000,      // 3 seconds between tasks
  delay_between_cycles: 30000,    // 30 seconds between full cycles
  max_retries: 3,                 // Retry failed tasks
  stats_file: join(__dirname, '../generation-stats.json'),
  repo_dir: join(__dirname, '..')
};

// Setup git repository - ensures .git exists (Railway doesn't preserve it)
async function setupGitRepo() {
  const execOptions = { cwd: CONFIG.repo_dir, encoding: 'utf-8', stdio: 'pipe' };

  // Check if git is available
  try {
    execSync('git --version', execOptions);
    console.log('✅ Git is available');
  } catch (e) {
    console.error('❌ Git is NOT installed! Cannot sync to GitHub.');
    return false;
  }

  // Check if .git directory exists
  try {
    execSync('git rev-parse --git-dir', execOptions);
    console.log('✅ Git repository already initialized');

    // Ensure git user is configured
    try {
      execSync('git config user.email "ai-generator@aiplatformslist.com"', execOptions);
      execSync('git config user.name "AI Content Generator"', execOptions);
      console.log('✅ Git user configured');
    } catch (e) {
      // Ignore if already configured
    }

    return true;
  } catch (e) {
    console.log('⚠️  No .git directory found, initializing git repo...');
  }

  try {
    // Initialize git repo
    execSync('git init', execOptions);
    console.log('✅ Git initialized');

    // Configure git user
    execSync('git config user.email "ai-generator@aiplatformslist.com"', execOptions);
    execSync('git config user.name "AI Content Generator"', execOptions);
    console.log('✅ Git user configured');

    // Add remote (use HTTPS or SSH depending on what's available)
    let repoUrl;
    if (CONFIG.github_token) {
      // Use token if available
      repoUrl = `https://x-access-token:${CONFIG.github_token}@github.com/${CONFIG.github_repo}.git`;
    } else {
      // Use standard HTTPS URL (Railway might have git credentials configured)
      repoUrl = `https://github.com/${CONFIG.github_repo}.git`;
    }

    execSync(`git remote add origin "${repoUrl}"`, execOptions);
    console.log('✅ Remote added');

    // Fetch and reset to match remote (keep local files, update git tracking)
    execSync('git fetch origin master', execOptions);
    execSync('git reset origin/master', execOptions);
    console.log('✅ Synced with remote master branch');

    return true;
  } catch (error) {
    console.error(`❌ Failed to setup git repo: ${error.message}`);
    console.error(`   This is OK if running locally - git sync will be disabled`);
    return false;
  }
}

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
    'insufficient quota',
    'rate_limit',
    'rate limit',
    'billing',
    'credit',
    'credits',
    'quota exceeded',
    'quota_exceeded',
    'payment required',
    'payment_required',
    'balance',
    'insufficient balance',
    '402',
    '429',
    'too many requests',
    'exceed',
    'limit reached'
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
        log(`💰 API credits exhausted detected!`, 'money');
        resolve({ success: false, credits_exhausted: true });
      } else if (code === 0) {
        // Check if script actually wrote files by looking for success indicators in output
        const hasWrites = stdout.includes('Saved') || stdout.includes('✅') || stdout.includes('💾') ||
                         stdout.includes('Added') || stdout.includes('Updated') ||
                         stdout.includes('Generated') || stdout.includes('Created');
        if (!hasWrites) {
          log(`⚠️  Script completed but DID NOT write any files!`, 'warning');
          log(`   This means the API call likely failed silently`, 'warning');
          log(`   Last 300 chars of output: ${stdout.slice(-300)}`, 'info');
          // Treat this as a failure - don't increment stats
          resolve({ success: false, error: 'No files written', hasWrites: false });
        } else {
          resolve({ success: true, stdout, stderr, hasWrites: true });
        }
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
    name: 'Mass Platform Discovery',
    script: 'scripts/mass-discovery.mjs',
    args: ['--batch=15', '--batches=12', '--workers=3'],
    onSuccess: (stdout) => {
      // Parse actual platforms added from output
      const match = stdout.match(/✅.*?Added (\d+) new platform/i);
      if (match) {
        const added = parseInt(match[1]);
        stats.platforms_discovered += added;
        log(`📊 Actually added ${added} new platforms (rest were duplicates)`, 'info');
      }
    }
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
  },
  {
    name: 'Blog Posts',
    script: 'scripts/generate-blog-posts.mjs',
    args: ['--count=2'],
    onSuccess: () => { stats.blog_posts_generated = (stats.blog_posts_generated || 0) + 2; },
    frequency: 2  // Generate 2 blog posts every 2nd cycle
  },
  {
    name: 'URL Validation & Cleanup',
    script: 'scripts/validate-urls.mjs',
    args: ['--remove'],
    onSuccess: () => {
      stats.url_validations = (stats.url_validations || 0) + 1;
      stats.last_url_validation = new Date().toISOString();
    },
    frequency: 10  // Run every 10th cycle (weekly with ~7 cycles/day)
  }
];

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run a single cycle
async function runCycle() {
  log(`Starting Cycle #${stats.cycles_completed + 1}`, 'cycle');

  let tasksSucceeded = 0;
  let tasksFailed = 0;

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

    if (result.success) {
      if (!result.hasWrites) {
        log(`⚠️  ${task.name}: No file writes detected, skipping stat increment`, 'warning');
        tasksFailed++;
      } else if (task.onSuccess) {
        task.onSuccess(result.stdout || '');
        log(`✅ ${task.name}: Stats updated`, 'success');
        tasksSucceeded++;
      } else {
        tasksSucceeded++;
      }
    } else {
      tasksFailed++;
      log(`❌ ${task.name}: Failed - ${result.error || 'Unknown error'}`, 'error');
    }

    saveStats();

    // Delay between tasks
    log(`Waiting ${CONFIG.delay_between_tasks / 1000}s before next task...`, 'info');
    await sleep(CONFIG.delay_between_tasks);
  }

  stats.cycles_completed++;
  saveStats();

  // Check if entire cycle was unproductive
  if (tasksSucceeded === 0 && tasksFailed > 0) {
    log(`⚠️  CYCLE FAILED: 0 tasks succeeded, ${tasksFailed} tasks failed!`, 'error');
    log(`   This usually means API credits are exhausted or API is down`, 'warning');

    // Track consecutive failed cycles
    stats.consecutive_failed_cycles = (stats.consecutive_failed_cycles || 0) + 1;
    saveStats();

    if (stats.consecutive_failed_cycles >= 3) {
      log(`❌ STOPPING: ${stats.consecutive_failed_cycles} consecutive failed cycles`, 'error');
      log(`   Something is wrong - likely out of API credits`, 'error');
      stats.credits_exhausted = true;
      saveStats();
      return false;
    }

    return true; // Continue but mark as failed
  }

  // Reset failed cycle counter on success
  if (tasksSucceeded > 0) {
    stats.consecutive_failed_cycles = 0;
    saveStats();
  }

  return true;
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Started:                  ${stats.started}`);
  console.log(`Cycles Completed:         ${stats.cycles_completed}`);
  console.log(`API Calls Made:           ${stats.api_calls}`);
  console.log(`Platforms Discovered:     ${stats.platforms_discovered}`);
  console.log(`Platforms Recategorized:  ${stats.platforms_recategorized || 0}`);
  console.log(`Pillar Pages:             ${stats.pillar_pages_generated}`);
  console.log(`Comparisons:              ${stats.comparisons_generated}`);
  console.log(`Alternatives:             ${stats.alternatives_generated}`);
  console.log(`Best-Of Pages:            ${stats.bestof_generated}`);
  console.log(`Blog Posts:               ${stats.blog_posts_generated || 0}`);
  console.log(`Errors:                   ${stats.errors.length}`);
  console.log(`Credits Exhausted:        ${stats.credits_exhausted ? 'YES' : 'No'}`);
  console.log(`Git Syncs:                ${stats.git_syncs || 0}`);
  console.log(`Failed Cycles (consec):   ${stats.consecutive_failed_cycles || 0}`);
  console.log(`Cycles w/o Commits:       ${stats.cycles_without_commits || 0}`);
  console.log('='.repeat(60));
  console.log(`\n📁 Stats saved to: generation-stats.json\n`);
}

// Git sync - commit and push all changes to GitHub
async function syncToGitHub() {
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

    // Log what files changed
    if (status) {
      log('Changed files:', 'info');
      status.split('\n').forEach(line => {
        log(`  ${line}`, 'info');
      });
    }

    // Stage all content files
    const filesToAdd = [
      'platforms.json',
      'affiliate-opportunities.md',
      'generation-stats.json',
      'pillar-content/',
      'comparison-content/',
      'alternatives-content/',
      'bestof-content/',
      'blog-posts/'
    ];

    let stagedCount = 0;
    for (const file of filesToAdd) {
      try {
        execSync(`git add "${file}"`, execOptions);
        const addedFiles = execSync(`git diff --cached --name-only`, execOptions).toString();
        if (addedFiles.includes(file.replace('/', ''))) {
          stagedCount++;
          log(`  ✓ Staged: ${file}`, 'info');
        }
      } catch (e) {
        // File might not exist yet - that's ok
        log(`  ⊘ Skipped: ${file} (not found or unchanged)`, 'info');
      }
    }

    log(`Total staged: ${stagedCount} files/folders`, 'info');

    // Check if there are staged changes
    const stagedStatus = execSync('git diff --cached --name-only', execOptions).toString().trim();

    if (!stagedStatus) {
      log('⚠️  No staged changes to commit!', 'warning');
      log('⚠️  This usually means files were not written by child scripts!', 'warning');

      // This is a critical indicator that the cycle was unproductive
      stats.cycles_without_commits = (stats.cycles_without_commits || 0) + 1;
      saveStats();

      if (stats.cycles_without_commits >= 3) {
        log(`❌ WARNING: ${stats.cycles_without_commits} consecutive cycles with no commits`, 'error');
        log(`   This suggests API failures or credit exhaustion`, 'error');
      }

      return false; // Return false to indicate sync failed
    }

    // Reset counter on successful commit
    stats.cycles_without_commits = 0;

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

  // Setup git repository (Railway doesn't preserve .git directory)
  log('Setting up git repository...', 'info');
  const gitReady = await setupGitRepo();
  if (gitReady) {
    log('Git repository ready for syncing', 'success');
  } else {
    log('Git sync will be disabled (repo setup failed)', 'warning');
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    log('\nShutting down gracefully...', 'warning');
    await syncToGitHub();
    printSummary();
    process.exit(0);
  });

  // Main loop - runs until credits exhausted or too many failures
  while (!stats.credits_exhausted) {
    const shouldContinue = await runCycle();

    if (!shouldContinue) {
      log('Cycle indicated we should stop', 'warning');
      break;
    }

    log(`Cycle ${stats.cycles_completed} complete.`, 'success');

    // Sync to GitHub after each cycle
    const syncSuccess = await syncToGitHub();

    // Check for persistent failures (no commits for multiple cycles)
    if (!syncSuccess && (stats.cycles_without_commits || 0) >= 5) {
      log(`❌ STOPPING: ${stats.cycles_without_commits} cycles without any commits!`, 'error');
      log(`   Worker appears stuck - likely API issues or credit exhaustion`, 'error');
      stats.credits_exhausted = true;
      saveStats();
      break;
    }

    // Safety check: if we've had many consecutive failed cycles, stop
    if ((stats.consecutive_failed_cycles || 0) >= 3) {
      log(`❌ STOPPING: Too many consecutive failed cycles`, 'error');
      break;
    }

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
