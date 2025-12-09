#!/usr/bin/env node

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find features that are backend-testable and not passing
const backendKeywords = [
  'backend', 'API', 'endpoint', 'server', 'response', 'request',
  'timeout', 'error', 'handle', 'validate', 'concurrent', 'multiple'
];

const failing = data.filter(f => !f.passes);

console.log('\nBackend-testable failing features:\n');

failing.forEach((feature, i) => {
  const desc = feature.description.toLowerCase();
  const isBackendRelated = backendKeywords.some(keyword => desc.includes(keyword.toLowerCase()));

  if (isBackendRelated) {
    const index = data.indexOf(feature);
    console.log(`#${index + 1}: ${feature.description}`);
    console.log(`   Category: ${feature.category}`);
    console.log();
  }
});
