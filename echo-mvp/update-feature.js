#!/usr/bin/env node

/**
 * Helper script to update feature_list.json
 * Usage: node update-feature.js <feature_index> <true|false>
 */

const fs = require('fs');

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node update-feature.js <feature_index> <true|false>');
  process.exit(1);
}

const featureIndex = parseInt(args[0], 10);
const passesValue = args[1] === 'true';

if (isNaN(featureIndex)) {
  console.error('Feature index must be a number');
  process.exit(1);
}

const filePath = './feature_list.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (featureIndex < 0 || featureIndex >= data.length) {
  console.error(`Feature index out of range (0-${data.length - 1})`);
  process.exit(1);
}

const feature = data[featureIndex];
const oldValue = feature.passes;
feature.passes = passesValue;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log(`✅ Updated feature ${featureIndex}:`);
console.log(`   Description: ${feature.description}`);
console.log(`   Old value: ${oldValue}`);
console.log(`   New value: ${passesValue}`);
