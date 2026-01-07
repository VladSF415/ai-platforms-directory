const platforms = require('./platforms.json');

// Filter for AI writing tools
const writingTools = platforms.filter(p => {
  const name = (p.name || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const features = (p.features || []).join(' ').toLowerCase();
  const tags = (p.tags || []).join(' ').toLowerCase();

  // Include if mentions writing, content, copywriting, text generation
  const isWriting = desc.includes('writing') || desc.includes('content creation') ||
                    desc.includes('copywriting') || desc.includes('blog') ||
                    desc.includes('article') || features.includes('writing') ||
                    features.includes('content generation') || tags.includes('writing');

  // Exclude video/audio/code specific tools
  const notExcluded = !name.includes('video') && !name.includes('audio') &&
                      !desc.includes('video editing') && !desc.includes('audio');

  return isWriting && notExcluded && p.rating >= 3.5;
});

// Sort by rating and view count
writingTools.sort((a, b) => {
  const scoreA = (a.rating || 0) * 0.7 + ((a.viewCount || 0) / 1000) * 0.3;
  const scoreB = (b.rating || 0) * 0.7 + ((b.viewCount || 0) / 1000) * 0.3;
  return scoreB - scoreA;
});

// Get top 15 for selection
const top15 = writingTools.slice(0, 15);

console.log('Top AI Writing Tools:\n');
top15.forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (Rating: ${p.rating}/5, Pricing: ${p.pricing})`);
  console.log(`   Slug: ${p.slug}`);
  console.log(`   Category: ${p.category}`);
  console.log(`   Description: ${p.description.substring(0, 100)}...`);
  console.log('');
});

console.log('\n=== FULL DATA FOR TOP 10 ===\n');
console.log(JSON.stringify(top15.slice(0, 10), null, 2));
