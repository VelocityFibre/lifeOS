const fs = require('fs');

const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

console.log('First 10 failing features:\n');
let count = 0;
features.forEach((f, i) => {
  if (!f.passes && count < 10) {
    console.log(`#${i}: ${f.description}`);
    count++;
  }
});
