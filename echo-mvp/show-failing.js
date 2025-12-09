#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));
const failing = data.filter(f => !f.passes);

console.log('Next 20 failing features:\n');
failing.slice(0, 20).forEach((f, i) => {
  const idx = data.indexOf(f) + 1;
  console.log(`#${idx}: ${f.description}`);
  console.log(`   Category: ${f.category}`);
  console.log('');
});

console.log(`\nTotal failing: ${failing.length}/206`);
console.log(`Total passing: ${data.filter(f => f.passes).length}/206`);
