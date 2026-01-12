#!/usr/bin/env node
import { readFileSync } from 'fs';

console.log('🔍 Analyzing Server.js for Potential 5xx Error Causes\n');
console.log('='.repeat(60));

const issues = [];
const warnings = [];

// Read server.js
const serverContent = readFileSync('./server.js', 'utf-8');
const lines = serverContent.split('\n');

console.log('\n📄 Analyzing server.js...');
console.log(`   Total lines: ${lines.length}`);

// Check for missing error handling
console.log('\n🛡️  Error Handling Analysis...');

let routeCount = 0;
let tryCatchCount = 0;
let catchBlocks = 0;

// Count routes
const routeMatches = serverContent.match(/fastify\.(get|post|put|delete|patch)\(/g);
routeCount = routeMatches ? routeMatches.length : 0;

// Count try-catch blocks
const tryCatchMatches = serverContent.match(/try\s*\{/g);
tryCatchCount = tryCatchMatches ? tryCatchMatches.length : 0;

// Count catch blocks
const catchMatches = serverContent.match(/\}\s*catch\s*\(/g);
catchBlocks = catchMatches ? catchMatches.length : 0;

console.log(`   Routes defined: ${routeCount}`);
console.log(`   Try-catch blocks: ${tryCatchCount}`);
console.log(`   Catch blocks: ${catchBlocks}`);

if (tryCatchCount < routeCount * 0.5) {
  warnings.push({
    type: 'INSUFFICIENT_ERROR_HANDLING',
    message: `Only ${tryCatchCount} try-catch blocks for ${routeCount} routes (< 50% coverage)`
  });
}

// Check for unhandled promise rejections
console.log('\n⚡ Promise Handling Analysis...');

const asyncFunctions = serverContent.match(/async\s+\(/g) || [];
const awaitStatements = serverContent.match(/await\s+/g) || [];

console.log(`   Async function declarations: ${asyncFunctions.length}`);
console.log(`   Await statements: ${awaitStatements.length}`);

if (awaitStatements.length > tryCatchCount * 3) {
  warnings.push({
    type: 'UNPROTECTED_AWAITS',
    message: `${awaitStatements.length} await statements but only ${tryCatchCount} try-catch blocks`
  });
}

// Check for common error-prone patterns
console.log('\n⚠️  Common Error Patterns...');

// 1. JSON.parse without try-catch
const jsonParseCount = (serverContent.match(/JSON\.parse\(/g) || []).length;
const jsonParseInTryCatch = (serverContent.match(/try\s*\{[^}]*JSON\.parse/gs) || []).length;

console.log(`   JSON.parse calls: ${jsonParseCount}`);
console.log(`   JSON.parse in try-catch: ${jsonParseInTryCatch}`);

if (jsonParseCount > jsonParseInTryCatch) {
  issues.push({
    type: 'UNPROTECTED_JSON_PARSE',
    severity: 'HIGH',
    count: jsonParseCount - jsonParseInTryCatch,
    message: `${jsonParseCount - jsonParseInTryCatch} JSON.parse calls without error handling`
  });
}

// 2. readFileSync without try-catch (can cause ENOENT errors)
const readFileSyncCount = (serverContent.match(/readFileSync\(/g) || []).length;
console.log(`   readFileSync calls: ${readFileSyncCount}`);

if (readFileSyncCount > 5) {
  warnings.push({
    type: 'MULTIPLE_READFILESYNC',
    count: readFileSyncCount,
    message: `${readFileSyncCount} readFileSync calls (can cause ENOENT errors if files missing)`
  });
}

// 3. Database queries without error handling
const dbQueryPatterns = ['platforms.find', 'platforms.filter', 'platforms.map'];
let dbQueryCount = 0;
dbQueryPatterns.forEach(pattern => {
  dbQueryCount += (serverContent.match(new RegExp(pattern, 'g')) || []).length;
});

console.log(`   Database/array operations: ${dbQueryCount}`);

// 4. Missing null checks
const nullChecks = (serverContent.match(/if\s*\(\s*!\s*\w+\s*\)/g) || []).length;
console.log(`   Null/undefined checks: ${nullChecks}`);

if (nullChecks < routeCount) {
  warnings.push({
    type: 'INSUFFICIENT_NULL_CHECKS',
    message: `Only ${nullChecks} null checks for ${routeCount} routes`
  });
}

// Check for memory issues
console.log('\n💾 Memory/Resource Management...');

// Large array operations
const mapOperations = (serverContent.match(/\.map\(/g) || []).length;
const filterOperations = (serverContent.match(/\.filter\(/g) || []).length;
const sliceOperations = (serverContent.match(/\.slice\(/g) || []).length;

console.log(`   .map() operations: ${mapOperations}`);
console.log(`   .filter() operations: ${filterOperations}`);
console.log(`   .slice() operations: ${sliceOperations}`);

if (mapOperations > 20) {
  warnings.push({
    type: 'MULTIPLE_MAP_OPERATIONS',
    count: mapOperations,
    message: `${mapOperations} .map() operations (can cause memory issues with large arrays)`
  });
}

// Check for timeout handling
console.log('\n⏱️  Timeout Handling...');

const timeoutCount = (serverContent.match(/timeout-minutes|timeout:|setTimeout/g) || []).length;
console.log(`   Timeout configurations: ${timeoutCount}`);

if (timeoutCount < 2) {
  warnings.push({
    type: 'MISSING_TIMEOUTS',
    message: 'No timeout configurations found (can cause hanging requests)'
  });
}

// Check for rate limiting
console.log('\n🚦 Rate Limiting...');

const rateLimitImport = serverContent.includes('@fastify/rate-limit');
const rateLimitConfig = serverContent.includes('rateLimit');

console.log(`   Rate limit imported: ${rateLimitImport ? 'Yes' : 'No'}`);
console.log(`   Rate limit configured: ${rateLimitConfig ? 'Yes' : 'No'}`);

if (!rateLimitImport || !rateLimitConfig) {
  warnings.push({
    type: 'MISSING_RATE_LIMITING',
    message: 'Rate limiting not properly configured (can cause server overload)'
  });
}

// Check for CORS issues
console.log('\n🌐 CORS Configuration...');

const corsImport = serverContent.includes('@fastify/cors');
const corsConfig = serverContent.includes('cors');

console.log(`   CORS imported: ${corsImport ? 'Yes' : 'No'}`);
console.log(`   CORS configured: ${corsConfig ? 'Yes' : 'No'}`);

// Check specific error-prone routes
console.log('\n🔍 Checking Specific Routes...');

const criticalRoutes = [
  { route: '/api/platforms', pattern: '/api/platforms' },
  { route: '/api/categories', pattern: '/api/categories' },
  { route: '/platform/:slug', pattern: '/platform/' },
  { route: '/category/:category', pattern: '/category/' }
];

criticalRoutes.forEach(({ route, pattern }) => {
  if (serverContent.includes(pattern)) {
    console.log(`   ✓ ${route} found`);
  } else {
    warnings.push({
      type: 'MISSING_CRITICAL_ROUTE',
      route: route,
      message: `Critical route ${route} not found`
    });
  }
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 SERVER ERROR ANALYSIS RESULTS\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No obvious error-prone patterns found!\n');
} else {
  if (issues.length > 0) {
    console.log(`❌ ISSUES (${issues.length}):\n`);
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.type} (${issue.severity})`);
      console.log(`   ${issue.message}`);
      if (issue.count) console.log(`   Count: ${issue.count}`);
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning.type}`);
      console.log(`   ${warning.message}`);
      if (warning.count) console.log(`   Count: ${warning.count}`);
      console.log('');
    });
  }
}

// Recommendations
console.log('='.repeat(60));
console.log('\n💡 RECOMMENDATIONS TO PREVENT 5xx ERRORS\n');

console.log('1. **Add Error Handling**');
console.log('   - Wrap all async operations in try-catch');
console.log('   - Add error handling to JSON.parse calls');
console.log('   - Add error handling to file reads');
console.log('   - Add fallbacks for missing data');
console.log('');

console.log('2. **Add Null/Undefined Checks**');
console.log('   - Check if platform exists before accessing properties');
console.log('   - Check if category exists before filtering');
console.log('   - Validate request parameters');
console.log('   - Return 404 instead of crashing');
console.log('');

console.log('3. **Add Timeouts**');
console.log('   - Set request timeout (e.g., 30 seconds)');
console.log('   - Set database query timeout');
console.log('   - Handle timeout errors gracefully');
console.log('');

console.log('4. **Add Resource Limits**');
console.log('   - Limit array sizes for map/filter operations');
console.log('   - Add pagination for large datasets');
console.log('   - Implement caching for expensive operations');
console.log('');

console.log('5. **Add Monitoring**');
console.log('   - Log all errors with stack traces');
console.log('   - Add error tracking (Sentry, LogRocket)');
console.log('   - Monitor memory usage');
console.log('   - Set up alerts for error rate spikes');
console.log('');

console.log('6. **Add Graceful Degradation**');
console.log('   - Return partial results if some operations fail');
console.log('   - Cache results to serve during errors');
console.log('   - Add circuit breakers for external APIs');
console.log('');

// Summary
console.log('='.repeat(60));
console.log('\n📈 SUMMARY\n');
console.log(`Total Issues: ${issues.length}`);
console.log(`Total Warnings: ${warnings.length}`);
console.log('');
console.log(`Routes: ${routeCount}`);
console.log(`Error handling coverage: ${Math.round((tryCatchCount / routeCount) * 100)}%`);
console.log('');

if (issues.length > 0 || warnings.length > 0) {
  console.log('⚠️  Action Required: Address issues above to prevent 5xx errors');
} else {
  console.log('✅ Server error handling appears adequate');
}

console.log('\n' + '='.repeat(60));
