#!/usr/bin/env node

const http = require('http');

function fetchFrontend() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8081', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

fetchFrontend()
  .then(html => {
    console.log('Frontend HTML response:');
    console.log('='.repeat(50));
    console.log('Length:', html.length, 'bytes');
    console.log('First 2000 characters:');
    console.log(html.substring(0, 2000));
    console.log('='.repeat(50));

    // Check for key elements
    console.log('\nKey element checks:');
    console.log('- Has <!DOCTYPE html>:', html.includes('<!DOCTYPE html>'));
    console.log('- Has <html>', html.includes('<html'));
    console.log('- Has root element:', html.includes('root') || html.includes('app'));
    console.log('- Has JavaScript bundle:', html.includes('.js'));
    console.log('- Is likely React app:', html.includes('react') || html.includes('bundle'));
  })
  .catch(err => {
    console.error('Error fetching frontend:', err.message);
    process.exit(1);
  });
