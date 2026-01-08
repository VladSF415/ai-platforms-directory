import { readdirSync, readFileSync } from 'fs';

const files = readdirSync('pillar-content').filter(f => f.endsWith('.json'));

console.log(`Checking ${files.length} pillar content files:\n`);

let withPlatforms = 0;
let withoutPlatforms = 0;

files.forEach(file => {
  const content = JSON.parse(readFileSync(`pillar-content/${file}`, 'utf-8'));
  const count = (content.platforms || []).length;

  if (count > 0) {
    withPlatforms++;
    console.log(`✅ ${file}: ${count} platforms`);
  } else {
    withoutPlatforms++;
    console.log(`❌ ${file}: NO platforms`);
  }
});

console.log(`\nSummary:`);
console.log(`- With platforms: ${withPlatforms}`);
console.log(`- Without platforms: ${withoutPlatforms}`);
