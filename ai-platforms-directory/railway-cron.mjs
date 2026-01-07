#!/usr/bin/env node
/**
 * Railway Cron Job - Mass Discovery
 *
 * Runs on Railway's servers every 4 hours
 * Discovers 300 platforms per run = 1800/day
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🚀 Railway Cron: Starting mass discovery...');
console.log(`   Time: ${new Date().toISOString()}`);

// Check API key
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY not set in Railway environment');
  process.exit(1);
}

const beforeCount = JSON.parse(readFileSync('./platforms.json', 'utf-8')).length;
console.log(`   Current platforms: ${beforeCount}`);

try {
  // Run mass discovery
  console.log('\n🔍 Running mass-discovery...');

  const output = execSync('node scripts/mass-discovery.mjs --batch=25 --batches=12 --workers=3', {
    encoding: 'utf-8',
    stdio: 'inherit',
    env: { ...process.env }
  });

  const afterCount = JSON.parse(readFileSync('./platforms.json', 'utf-8')).length;
  const added = afterCount - beforeCount;

  console.log(`\n✅ Discovery complete!`);
  console.log(`   Added: ${added} platforms`);
  console.log(`   Total: ${afterCount} platforms`);

  // Commit and push changes
  console.log('\n📦 Committing changes...');

  execSync('git config user.name "Railway Cron Bot"');
  execSync('git config user.email "bot@railway.app"');
  execSync('git add platforms.json MASS_DISCOVERY_REPORT.md');

  const commitMsg = `Railway cron: +${added} platforms (total: ${afterCount})

Automated mass discovery via Railway cron
- Added: ${added} new platforms
- Total: ${afterCount} platforms
- Timestamp: ${new Date().toISOString()}

🤖 Generated with [Claude Code](https://claude.com/claude-code) - Railway Cron

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`;

  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

  console.log('   ✅ Committed');

  // Push will trigger Railway auto-deployment
  execSync('git push origin master');

  console.log('   ✅ Pushed - Railway will auto-deploy');
  console.log('\n🎉 Railway cron job complete!\n');

} catch (error) {
  console.error('\n❌ Railway cron failed:', error.message);
  process.exit(1);
}
