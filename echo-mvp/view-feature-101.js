const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));
console.log(JSON.stringify(data[100], null, 2));
