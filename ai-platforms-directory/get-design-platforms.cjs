const platforms = require('./platforms.json');

const design = platforms.filter(p => p.category === 'design-creative');

console.log(`Found ${design.length} design-creative platforms\n`);

design.sort((a, b) => (b.rating || 0) - (a.rating || 0));

design.forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.rating}/5) - ${p.slug}`);
});

console.log('\n\n=== FULL JSON DATA ===\n');
console.log(JSON.stringify(design, null, 2));
