const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
console.log(JSON.stringify(data[62], null, 2));
