#!/usr/bin/env node

/**
 * Validate Content Slugs
 *
 * This script validates that all platform slugs referenced in content files
 * (comparisons, alternatives, best-of) actually exist in platforms.json
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load all platform slugs
function loadPlatformSlugs() {
  const platforms = JSON.parse(readFileSync('platforms.json', 'utf-8'));
  const slugs = new Set();

  platforms.forEach(p => {
    if (p.slug) slugs.add(p.slug);
    if (p.id) slugs.add(p.id);
  });

  return slugs;
}

function validateFile(filePath, validSlugs) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const issues = [];

    // Check platform1Slug (comparisons)
    if (data.platform1Slug && !validSlugs.has(data.platform1Slug)) {
      issues.push(`platform1Slug "${data.platform1Slug}" not found`);
    }

    // Check platform2Slug (comparisons)
    if (data.platform2Slug && !validSlugs.has(data.platform2Slug)) {
      issues.push(`platform2Slug "${data.platform2Slug}" not found`);
    }

    // Check platformSlug (alternatives/best-of)
    if (data.platformSlug && !validSlugs.has(data.platformSlug)) {
      issues.push(`platformSlug "${data.platformSlug}" not found`);
    }

    // Check alternatives array
    if (data.alternatives) {
      data.alternatives.forEach((slug, i) => {
        if (!validSlugs.has(slug)) {
          issues.push(`alternatives[${i}] "${slug}" not found`);
        }
      });
    }

    // Check relatedPlatforms array
    if (data.relatedPlatforms) {
      data.relatedPlatforms.forEach((slug, i) => {
        if (!validSlugs.has(slug)) {
          issues.push(`relatedPlatforms[${i}] "${slug}" not found`);
        }
      });
    }

    // Check platforms array (best-of)
    if (data.platforms) {
      data.platforms.forEach((slug, i) => {
        if (!validSlugs.has(slug)) {
          issues.push(`platforms[${i}] "${slug}" not found`);
        }
      });
    }

    return issues;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

function validateDirectory(dirPath, dirName, validSlugs) {
  console.log(`\n📁 Validating ${dirName}...`);

  try {
    const files = readdirSync(dirPath).filter(f => f.endsWith('.json'));
    let totalIssues = 0;
    const problemFiles = [];

    for (const file of files) {
      const filePath = join(dirPath, file);
      const issues = validateFile(filePath, validSlugs);

      if (issues.length > 0) {
        totalIssues += issues.length;
        problemFiles.push({ file, issues });
        console.log(`\n❌ ${file}:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }

    if (problemFiles.length === 0) {
      console.log(`✅ All ${files.length} files valid!`);
    } else {
      console.log(`\n${dirName} Summary: ${problemFiles.length}/${files.length} files have issues (${totalIssues} total issues)`);
    }

    return { problemFiles, totalIssues };
  } catch (error) {
    console.error(`Error validating ${dirName}:`, error.message);
    return { problemFiles: [], totalIssues: 0 };
  }
}

// Main execution
console.log('🔍 Validating Content Slug References\n');

const validSlugs = loadPlatformSlugs();
console.log(`📊 Loaded ${validSlugs.size} valid platform slugs\n`);

const results = {
  comparisons: { problemFiles: [], totalIssues: 0 },
  alternatives: { problemFiles: [], totalIssues: 0 },
  bestOf: { problemFiles: [], totalIssues: 0 }
};

results.comparisons = validateDirectory('comparison-content', 'Comparisons', validSlugs);
results.alternatives = validateDirectory('alternatives-content', 'Alternatives', validSlugs);
results.bestOf = validateDirectory('bestof-content', 'Best-Of', validSlugs);

// Summary
const totalProblemFiles =
  results.comparisons.problemFiles.length +
  results.alternatives.problemFiles.length +
  results.bestOf.problemFiles.length;

const totalIssues =
  results.comparisons.totalIssues +
  results.alternatives.totalIssues +
  results.bestOf.totalIssues;

console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`Total files with issues: ${totalProblemFiles}`);
console.log(`Total slug issues found: ${totalIssues}`);

if (totalIssues > 0) {
  console.log('\n⚠️  Action needed:');
  console.log('  1. Review the issues above');
  console.log('  2. Fix slug references or add missing platforms');
  console.log('  3. Run this script again to verify');
  process.exit(1);
} else {
  console.log('\n✅ All content files have valid slug references!');
  process.exit(0);
}
