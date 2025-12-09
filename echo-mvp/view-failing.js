#!/usr/bin/env node

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(f => !f.passes);

console.log(`\nTotal failing: ${failing.length}\n`);

failing.slice(0, 20).forEach((feature, i) => {
  const index = data.indexOf(feature);
  console.log(`#${index + 1}: ${feature.description}`);
  console.log(`   Category: ${feature.category}`);
  console.log();
});
