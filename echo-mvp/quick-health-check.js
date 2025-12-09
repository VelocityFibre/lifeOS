#!/usr/bin/env node

const http = require('http');

console.log('Checking backend health...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Backend is running');
    console.log('Status code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.log('❌ Backend is not running');
  console.log('Error:', error.message);
  console.log('\nTo start the backend:');
  console.log('  cd mastra-backend && npm run api');
});

req.on('timeout', () => {
  console.log('❌ Backend request timed out');
  req.destroy();
});

req.end();
