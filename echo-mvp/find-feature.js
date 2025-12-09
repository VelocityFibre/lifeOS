const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const query = process.argv[2] || 'Conversation history';
features.forEach((f, i) => {
  if (f.description.includes(query)) {
    console.log(`Index: ${i}, Description: ${f.description}`);
  }
});
