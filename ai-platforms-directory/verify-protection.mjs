#!/usr/bin/env node

/**
 * Verification Script for Content Protection
 * Tests if all security measures are active on the live site
 */

const SITE_URL = 'https://aiplatformslist.com';

console.log('🔍 Verifying Content Protection...\n');

// Test 1: Rate Limiting Headers
async function testRateLimiting() {
  console.log('1️⃣  Testing Rate Limiting...');
  try {
    const response = await fetch(`${SITE_URL}/api/platforms?limit=1`);
    const headers = {
      limit: response.headers.get('x-ratelimit-limit'),
      remaining: response.headers.get('x-ratelimit-remaining'),
      reset: response.headers.get('x-ratelimit-reset')
    };

    if (headers.limit) {
      console.log('   ✅ Rate limiting is ACTIVE');
      console.log(`   📊 Limit: ${headers.limit} requests/minute`);
      console.log(`   📊 Remaining: ${headers.remaining}`);
      console.log(`   📊 Reset: ${new Date(headers.reset * 1000).toLocaleTimeString()}`);
      return true;
    } else {
      console.log('   ❌ Rate limiting NOT detected (headers missing)');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error testing rate limiting:', error.message);
    return false;
  }
}

// Test 2: Copyright Watermarks
async function testCopyrightWatermark() {
  console.log('\n2️⃣  Testing Copyright Watermarks...');
  try {
    const response = await fetch(`${SITE_URL}/api/platforms?limit=1`);
    const data = await response.json();

    if (data._copyright && data._source) {
      console.log('   ✅ Copyright watermarks are ACTIVE');
      console.log(`   📝 Copyright: ${data._copyright}`);
      console.log(`   🔗 Source: ${data._source}`);
      return true;
    } else {
      console.log('   ❌ Copyright watermarks NOT found in API response');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error testing copyright:', error.message);
    return false;
  }
}

// Test 3: Bot Detection
async function testBotDetection() {
  console.log('\n3️⃣  Testing Bot Detection...');
  try {
    // Test with scraper user agent
    const response = await fetch(`${SITE_URL}/api/platforms`, {
      headers: {
        'User-Agent': 'python-requests/2.28.0'
      }
    });

    if (response.status === 403) {
      console.log('   ✅ Bot detection is ACTIVE');
      console.log('   🚫 Scraper bots are being blocked (403 Forbidden)');
      return true;
    } else {
      console.log('   ⚠️  Bot detection may not be active (scraper not blocked)');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error testing bot detection:', error.message);
    return false;
  }
}

// Test 4: Robots.txt Protection
async function testRobotsTxt() {
  console.log('\n4️⃣  Testing Robots.txt...');
  try {
    const response = await fetch(`${SITE_URL}/robots.txt`);
    const text = await response.text();

    const hasChineseBlock = text.includes('Baiduspider') && text.includes('Sogou');
    const hasScraperBlock = text.includes('HTTrack') && text.includes('WebReaper');
    const hasCopyright = text.includes('© 2025');
    const hasCrawlDelay = text.includes('Crawl-delay: 2');

    if (hasChineseBlock && hasScraperBlock) {
      console.log('   ✅ Robots.txt protection is ACTIVE');
      console.log(`   🇨🇳 Chinese search engines blocked: ${hasChineseBlock ? 'Yes' : 'No'}`);
      console.log(`   🤖 Scraper bots blocked: ${hasScraperBlock ? 'Yes' : 'No'}`);
      console.log(`   ©️  Copyright notice: ${hasCopyright ? 'Yes' : 'No'}`);
      console.log(`   ⏱️  Crawl delay: ${hasCrawlDelay ? 'Yes (2s)' : 'No'}`);
      return true;
    } else {
      console.log('   ❌ Robots.txt protection incomplete');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error testing robots.txt:', error.message);
    return false;
  }
}

// Test 5: Health Check
async function testHealth() {
  console.log('\n5️⃣  Testing Site Health...');
  try {
    const response = await fetch(`${SITE_URL}/health`);
    const data = await response.json();

    if (response.status === 200 && data.status === 'ok') {
      console.log('   ✅ Site is healthy and running');
      console.log(`   📊 Platforms loaded: ${data.platforms}`);
      return true;
    } else {
      console.log('   ⚠️  Site health check failed');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error testing health:', error.message);
    return false;
  }
}

// Test 6: Check deployment version
async function testDeploymentVersion() {
  console.log('\n6️⃣  Checking Deployment Version...');
  try {
    const response = await fetch(`${SITE_URL}/robots.txt`);
    const text = await response.text();

    // Check for the new copyright notice (only in latest version)
    const hasNewCopyright = text.includes('© 2025 AI Platforms List. All content protected.');

    if (hasNewCopyright) {
      console.log('   ✅ Latest deployment is LIVE');
      console.log('   📅 Deployment includes all latest protections');
      return true;
    } else {
      console.log('   ⚠️  OLD version detected - Railway may not have deployed yet');
      console.log('   🔄 Check Railway dashboard for deployment status');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error checking version:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    rateLimiting: await testRateLimiting(),
    copyright: await testCopyrightWatermark(),
    botDetection: await testBotDetection(),
    robotsTxt: await testRobotsTxt(),
    health: await testHealth(),
    version: await testDeploymentVersion()
  };

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 PROTECTION SUMMARY');
  console.log('='.repeat(60));

  const total = Object.keys(results).length;
  const active = Object.values(results).filter(r => r).length;
  const percentage = Math.round((active / total) * 100);

  console.log(`\n✅ Active: ${active}/${total} (${percentage}%)`);
  console.log(`❌ Inactive: ${total - active}/${total}`);

  console.log('\nProtection Status:');
  console.log(`  ${results.rateLimiting ? '✅' : '❌'} Rate Limiting`);
  console.log(`  ${results.copyright ? '✅' : '❌'} Copyright Watermarks`);
  console.log(`  ${results.botDetection ? '✅' : '❌'} Bot Detection`);
  console.log(`  ${results.robotsTxt ? '✅' : '❌'} Robots.txt`);
  console.log(`  ${results.health ? '✅' : '❌'} Site Health`);
  console.log(`  ${results.version ? '✅' : '❌'} Latest Version`);

  console.log('\n' + '='.repeat(60));

  if (percentage === 100) {
    console.log('🎉 ALL PROTECTIONS ARE ACTIVE! Your content is protected.');
    console.log('\n📊 Monitor Google Analytics in 24-48 hours to see:');
    console.log('   - Lanzhou traffic → ZERO');
    console.log('   - China traffic → ZERO');
    console.log('   - Bot traffic → Significantly reduced');
  } else if (percentage >= 80) {
    console.log('⚠️  MOST protections are active, but check Railway deployment.');
  } else {
    console.log('❌ PROTECTIONS NOT FULLY DEPLOYED');
    console.log('\n🔧 Action Required:');
    console.log('   1. Check Railway dashboard: https://railway.app/dashboard');
    console.log('   2. Verify latest deployment is running');
    console.log('   3. Check deployment logs for errors');
    console.log('   4. May need to manually trigger redeploy');
  }

  console.log('='.repeat(60) + '\n');
}

// Execute
runTests().catch(console.error);
