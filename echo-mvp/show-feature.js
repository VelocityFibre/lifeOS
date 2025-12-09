const fs = require('fs');
const index = process.argv[2] || 23;
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
console.log(JSON.stringify(features[index], null, 2));
