#!/usr/bin/env node

/**
 * Comprehensive verification of current system state
 * This script checks all components and generates a report
 */

const http = require('http');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function checkBackendHealth() {
  log('cyan', '\n=== Backend Health Check ===');
  const response = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/health',
    method: 'GET',
  });

  if (response.status === 200 && response.data.status === 'ok') {
    log('green', '✅ Backend is running on port 3002');
    log('green', `   Status: ${response.data.status}`);
    log('green', `   Timestamp: ${response.data.timestamp}`);
    return true;
  } else {
    log('red', '❌ Backend not responding correctly');
    return false;
  }
}

async function checkFrontendServer() {
  log('cyan', '\n=== Frontend Server Check ===');
  const response = await makeRequest({
    hostname: 'localhost',
    port: 8081,
    path: '/',
    method: 'GET',
  });

  if (response.status === 200) {
    log('green', '✅ Frontend server is running on port 8081');
    return true;
  } else {
    log('red', '❌ Frontend server not responding');
    return false;
  }
}

async function checkChatEndpoint() {
  log('cyan', '\n=== Chat Endpoint Verification ===');

  // Test 1: Validate error handling
  const errorTest = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {});

  if (errorTest.status === 400 && errorTest.data.error === 'Message is required') {
    log('green', '✅ Error validation working');
  } else {
    log('red', '❌ Error validation not working');
  }

  // Test 2: Check demo mode functionality
  const demoTest = await makeRequest({
    hostname: 'localhost',
    port: 3002,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    message: 'Show my unread emails',
    accessToken: 'demo-token',
    threadId: 'test-123',
  });

  if (demoTest.status === 200 && demoTest.data.success) {
    log('green', '✅ Chat endpoint working in demo mode');
    log('green', `   Response preview: ${demoTest.data.text.substring(0, 60)}...`);
  } else {
    log('red', '❌ Chat endpoint not working correctly');
  }
}

async function checkFeatureList() {
  log('cyan', '\n=== Feature List Status ===');
  const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
  const passing = data.filter(f => f.passes).length;
  const total = data.length;
  const percentage = ((passing / total) * 100).toFixed(1);

  log('yellow', `Total features: ${total}`);
  log('green', `Passing: ${passing} (${percentage}%)`);
  log('red', `Remaining: ${total - passing}`);

  log('cyan', '\n=== Currently Passing Features ===');
  data.forEach((feature, index) => {
    if (feature.passes) {
      log('green', `${index + 1}. ${feature.description}`);
    }
  });

  log('cyan', '\n=== Next Features to Test ===');
  let count = 0;
  for (let i = 0; i < data.length && count < 10; i++) {
    if (!data[i].passes) {
      log('yellow', `${i + 1}. ${data[i].description}`);
      count++;
    }
  }
}

async function main() {
  log('blue', '\n========================================');
  log('blue', '   LifeOS Echo MVP - System Status');
  log('blue', '========================================');

  const backendOk = await checkBackendHealth();
  const frontendOk = await checkFrontendServer();

  if (backendOk) {
    await checkChatEndpoint();
  }

  await checkFeatureList();

  log('blue', '\n========================================');
  if (backendOk && frontendOk) {
    log('green', '✅ System is operational');
  } else {
    log('yellow', '⚠️  Some components need attention');
  }
  log('blue', '========================================\n');
}

main().catch((error) => {
  log('red', `\nFatal error: ${error.message}`);
  process.exit(1);
});
