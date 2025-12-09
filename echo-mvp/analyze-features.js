const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));

const failing = data
  .map((f, i) => ({ index: i, ...f }))
  .filter(f => !f.passes);

console.log(`Total failing: ${failing.length}\n`);
console.log('First 20 failing features:\n');

failing.slice(0, 20).forEach(f => {
  console.log(`#${f.index + 1}: ${f.description}`);
  console.log(`Category: ${f.category}`);
  console.log('');
});
