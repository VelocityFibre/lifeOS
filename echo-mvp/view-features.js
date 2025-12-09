#!/usr/bin/env node

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const start = parseInt(process.argv[2]) || 0;
const count = parseInt(process.argv[3]) || 20;

console.log(`\nShowing features ${start + 1} to ${Math.min(start + count, data.length)}:\n`);

for (let i = start; i < Math.min(start + count, data.length); i++) {
  const status = data[i].passes ? '✅ PASS' : '❌ FAIL';
  console.log(`${i + 1}. ${status} - ${data[i].description}`);
}

console.log(`\nTotal: ${data.length} features, ${data.filter(f => f.passes).length} passing\n`);
