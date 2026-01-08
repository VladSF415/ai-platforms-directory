import { readFileSync } from 'fs';

const content = JSON.parse(
  readFileSync('pillar-content/ultimate-guide-3d-generation-ai-tools-2025.json', 'utf-8')
);

console.log('ROOT pillar-content file:');
console.log('- Slug:', content.slug);
console.log('- Has platforms array:', content.platforms ? 'YES' : 'NO');
console.log('- Platform count:', content.platforms?.length || 0);
console.log('- Platforms:', content.platforms);
console.log('- Featured:', content.featured);
