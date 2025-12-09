#!/usr/bin/env node
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));

const failing = data.filter((f, i) => !f.passes);

console.log('Backend/API testable features (no UI needed):\n');

const backendKeywords = ['agent', 'api', 'backend', 'rate limit', 'error', 'timeout', 'security', 'oauth'];

failing.forEach((f, i) => {
  const idx = data.indexOf(f) + 1;
  const desc = f.description.toLowerCase();

  // Check if this looks like a backend feature
  const isBackendFeature = backendKeywords.some(keyword => desc.includes(keyword));

  // Exclude UI-specific features
  const isUIFeature = desc.includes('visual') ||
                      desc.includes('styling') ||
                      desc.includes('ui') ||
                      desc.includes('button') ||
                      desc.includes('simulator') ||
                      desc.includes('emulator') ||
                      desc.includes('frontend') ||
                      desc.includes('chat history') ||
                      desc.includes('clear') ||
                      desc.includes('hover') ||
                      desc.includes('focus') ||
                      desc.includes('keyboard') ||
                      desc.includes('screen reader') ||
                      desc.includes('spacing') ||
                      desc.includes('padding');

  if (isBackendFeature && !isUIFeature) {
    console.log(`#${idx}: ${f.description}`);
    console.log(`   Category: ${f.category}`);
    console.log('   Steps:');
    f.steps.forEach(step => console.log(`      ${step}`));
    console.log('');
  }
});
