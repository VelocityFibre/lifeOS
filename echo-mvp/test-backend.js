#!/usr/bin/env node

/**
 * Backend API Testing Script
 * Tests the Mastra backend endpoints to verify functionality
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3002;

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function test(description, testFn) {
  try {
    log(`\nTesting: ${description}`, 'cyan');
    await testFn();
    log('✅ PASSED', 'green');
    passedTests++;
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('Backend API Test Suite', 'blue');
  log('========================================\n', 'blue');

  // Test 1: Health endpoint
  await test('Health endpoint responds with status ok', async () => {
    const response = await makeRequest('/health');
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.status === 'ok', `Expected status "ok", got "${response.body.status}"`);
    assert(response.body.timestamp, 'Expected timestamp in response');
    log(`  Status: ${response.body.status}`, 'yellow');
    log(`  Timestamp: ${response.body.timestamp}`, 'yellow');
  });

  // Test 2: Chat endpoint requires message
  await test('Chat endpoint rejects empty request', async () => {
    const response = await makeRequest('/api/chat', 'POST', {});
    assert(response.statusCode === 400, `Expected status 400, got ${response.statusCode}`);
    assert(response.body.error, 'Expected error message in response');
    log(`  Error: ${response.body.error}`, 'yellow');
  });

  // Test 3: Chat endpoint accepts message in dev mode (no token required)
  await test('Chat endpoint accepts message in dev mode', async () => {
    const response = await makeRequest('/api/chat', 'POST', {
      message: 'Hello, can you help me with my email?'
    });
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    assert(response.body.text, 'Expected text in response');
    assert(response.body.threadId, 'Expected threadId in response');
    log(`  Response: ${response.body.text.substring(0, 100)}...`, 'yellow');
    log(`  Thread ID: ${response.body.threadId}`, 'yellow');
  });

  // Test 4: Chat endpoint handles email query
  await test('Chat endpoint handles "show my recent emails" query', async () => {
    const response = await makeRequest('/api/chat', 'POST', {
      message: 'Show me my recent emails'
    });
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    assert(response.body.text, 'Expected text in response');
    log(`  Response: ${response.body.text.substring(0, 150)}...`, 'yellow');
  });

  // Test 5: Chat endpoint handles search query
  await test('Chat endpoint handles "search for emails from john" query', async () => {
    const response = await makeRequest('/api/chat', 'POST', {
      message: 'Search for emails from john'
    });
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    log(`  Response: ${response.body.text.substring(0, 150)}...`, 'yellow');
  });

  // Test 6: Chat endpoint handles unread emails query
  await test('Chat endpoint handles "show unread emails" query', async () => {
    const response = await makeRequest('/api/chat', 'POST', {
      message: 'Show me my unread emails'
    });
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    log(`  Response: ${response.body.text.substring(0, 150)}...`, 'yellow');
  });

  // Test 7: Chat endpoint preserves thread ID
  await test('Chat endpoint preserves thread ID across messages', async () => {
    const response1 = await makeRequest('/api/chat', 'POST', {
      message: 'Hello',
      threadId: 'test-thread-123'
    });
    assert(response1.body.threadId === 'test-thread-123', 'Expected thread ID to be preserved');

    const response2 = await makeRequest('/api/chat', 'POST', {
      message: 'Another message',
      threadId: 'test-thread-123'
    });
    assert(response2.body.threadId === 'test-thread-123', 'Expected thread ID to be preserved in second message');
    log(`  Thread ID preserved: ${response2.body.threadId}`, 'yellow');
  });

  // Print summary
  log('\n========================================', 'blue');
  log('Test Results Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${passedTests + failedTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log('========================================\n', 'blue');

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
