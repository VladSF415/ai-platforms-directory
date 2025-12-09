#!/usr/bin/env node

/**
 * Fix Slug Mismatches in Content Files
 *
 * This script fixes common slug mismatches between content files
 * (comparisons, alternatives, best-of) and the actual platform slugs.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Common slug corrections
const SLUG_CORRECTIONS = {
  'deepl-api': 'deepl',
  'anthropic-claude-3': 'claude',
  'claude-3': 'claude',
  'gpt-4': 'chatgpt',
  'openai-gpt4': 'chatgpt',
  'elevenlabs-voice': 'elevenlabs',
  'huggingface-transformers': 'hugging-face-transformers',
  'google-gemini': 'gemini',
  'openai-whisper': 'whisper',
  // Add more as discovered
};

function fixSlugsInFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let data = JSON.parse(content);
    let modified = false;

    // Check and fix platform slugs
    for (const [wrongSlug, correctSlug] of Object.entries(SLUG_CORRECTIONS)) {
      // Fix in comparison files
      if (data.platform1Slug === wrongSlug) {
        console.log(`  Fixing platform1Slug: ${wrongSlug} → ${correctSlug}`);
        data.platform1Slug = correctSlug;
        modified = true;
      }
      if (data.platform2Slug === wrongSlug) {
        console.log(`  Fixing platform2Slug: ${wrongSlug} → ${correctSlug}`);
        data.platform2Slug = correctSlug;
        modified = true;
      }

      // Fix in alternatives/best-of files
      if (data.platformSlug === wrongSlug) {
        console.log(`  Fixing platformSlug: ${wrongSlug} → ${correctSlug}`);
        data.platformSlug = correctSlug;
        modified = true;
      }

      // Fix in related platforms/alternatives arrays
      if (data.alternatives) {
        data.alternatives = data.alternatives.map(alt => {
          if (alt === wrongSlug) {
            console.log(`  Fixing alternative: ${wrongSlug} → ${correctSlug}`);
            modified = true;
            return correctSlug;
          }
          return alt;
        });
      }

      if (data.relatedPlatforms) {
        data.relatedPlatforms = data.relatedPlatforms.map(slug => {
          if (slug === wrongSlug) {
            console.log(`  Fixing related platform: ${wrongSlug} → ${correctSlug}`);
            modified = true;
            return correctSlug;
          }
          return slug;
        });
      }
    }

    if (modified) {
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath, dirName) {
  console.log(`\n📁 Processing ${dirName}...`);

  try {
    const files = readdirSync(dirPath).filter(f => f.endsWith('.json'));
    let fixedCount = 0;

    for (const file of files) {
      const filePath = join(dirPath, file);
      const wasFixed = fixSlugsInFile(filePath);
      if (wasFixed) {
        fixedCount++;
        console.log(`✓ Fixed: ${file}`);
      }
    }

    console.log(`${dirName}: ${fixedCount}/${files.length} files fixed`);
    return fixedCount;
  } catch (error) {
    console.error(`Error processing directory ${dirName}:`, error.message);
    return 0;
  }
}

// Main execution
console.log('🔧 Fixing Slug Mismatches in Content Files\n');
console.log('Corrections to apply:');
Object.entries(SLUG_CORRECTIONS).forEach(([wrong, correct]) => {
  console.log(`  ${wrong} → ${correct}`);
});

let totalFixed = 0;

// Process each content directory
totalFixed += processDirectory('comparison-content', 'Comparisons');
totalFixed += processDirectory('alternatives-content', 'Alternatives');
totalFixed += processDirectory('bestof-content', 'Best-Of');

console.log(`\n✅ Complete! Fixed ${totalFixed} files total.`);

if (totalFixed > 0) {
  console.log('\n⚠️  Remember to:');
  console.log('  1. Review the changes');
  console.log('  2. Commit and push to deploy');
  console.log('  3. Test affected pages');
}
