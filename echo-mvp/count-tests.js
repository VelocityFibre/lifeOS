const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const passing = features.filter(f => f.passes).length;
const total = features.length;
console.log('Passing:', passing);
console.log('Total:', total);
console.log('Percentage:', (passing/total*100).toFixed(1) + '%');
