const fs = require('fs');

const features = JSON.parse(fs.readFileSync('./feature_list.json', 'utf-8'));

const index = features.findIndex(f => f.description.includes("Agent routing works correctly based on @mentions"));
if (index !== -1) {
  console.log(`Index ${index}: "${features[index].description}" - passes: ${features[index].passes}`);
  console.log(`Steps:`, features[index].steps);
}
