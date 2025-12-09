const fs = require('fs');

const features = JSON.parse(fs.readFileSync('./feature_list.json', 'utf-8'));

const targetFeatures = [
  'NativeWind/Tailwind styling renders correctly',
  'App has consistent color scheme throughout',
  'Typography is consistent and readable'
];

targetFeatures.forEach(target => {
  const index = features.findIndex(f => f.description === target);
  if (index !== -1) {
    console.log(`Index ${index}: "${features[index].description}" - passes: ${features[index].passes}`);
  }
});
