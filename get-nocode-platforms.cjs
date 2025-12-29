const platforms = require('./platforms.json');

const nocode = platforms.filter(p => p.category === 'no-code');

console.log(`Found ${nocode.length} no-code platforms\n`);
console.log(JSON.stringify(nocode, null, 2));
