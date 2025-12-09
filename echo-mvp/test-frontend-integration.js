#!/usr/bin/env node

/**
 * Frontend Integration Test Suite
 * Tests the frontend's API integration with the backend
 * Since browser automation is blocked, we verify the API layer works correctly
 */

const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const API_URL = 'localhost';
const API_PORT = 3002;
const FRONTEND_PORT = 8081;

let passedTests = 0;
let failedTests = 0;

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTest(description, testFn) {
  log('cyan', `\nTesting: ${description}`);
  try {
    await testFn();
    log('green', '✅ PASSED');
    passedTests++;
  } catch (error) {
    log('red', `❌ FAILED: ${error.message}`);
    failedTests++;
  }
}

async function main() {
  log('blue', '\n========================================');
  log('blue', 'Frontend Integration Test Suite');
  log('blue', '========================================\n');

  // Test 1: Backend health check (verifying existing feature)
  await runTest('Backend health endpoint responds correctly', async () => {
    const response = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/health',
      method: 'GET',
    });

    log('yellow', `  Status: ${response.data.status}`);
    assert(response.status === 200, 'Expected status 200');
    assert(response.data.status === 'ok', 'Expected status "ok"');
    assert(response.data.timestamp, 'Expected timestamp field');
  });

  // Test 2: Frontend server is accessible
  await runTest('Frontend server is accessible on port 8081', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/',
      method: 'GET',
    });

    log('yellow', `  Response status: ${response.status}`);
    assert(response.status === 200, 'Expected status 200');
    assert(typeof response.data === 'string', 'Expected HTML response');
  });

  // Test 3: Chat endpoint with demo mode (no token)
  await runTest('Chat endpoint works in demo mode (without Gmail token)', async () => {
    const response = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      message: 'Hello, what can you help me with?',
      accessToken: 'demo-token',
      threadId: 'test-thread-1',
    });

    log('yellow', `  Response: ${response.data.text.substring(0, 80)}...`);
    assert(response.status === 200, 'Expected status 200');
    assert(response.data.success, 'Expected success: true');
    assert(response.data.text, 'Expected text response');
    assert(response.data.threadId === 'test-thread-1', 'Expected thread ID preserved');
  });

  // Test 4: Chat endpoint handles email-related queries
  await runTest('Chat endpoint handles "show unread emails" query', async () => {
    const response = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      message: 'Show me my unread emails',
      accessToken: 'demo-token',
      threadId: 'test-thread-2',
    });

    log('yellow', `  Response: ${response.data.text.substring(0, 100)}...`);
    assert(response.status === 200, 'Expected status 200');
    assert(response.data.success, 'Expected success: true');
    assert(response.data.text.toLowerCase().includes('email'), 'Expected email-related response');
  });

  // Test 5: Chat endpoint handles search queries
  await runTest('Chat endpoint handles email search queries', async () => {
    const response = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      message: 'Search for emails from john@example.com',
      accessToken: 'demo-token',
      threadId: 'test-thread-3',
    });

    log('yellow', `  Response: ${response.data.text.substring(0, 100)}...`);
    assert(response.status === 200, 'Expected status 200');
    assert(response.data.success, 'Expected success: true');
    assert(response.data.text, 'Expected text response');
  });

  // Test 6: Chat endpoint validates required message field
  await runTest('Chat endpoint validates required message field', async () => {
    const response = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      accessToken: 'demo-token',
      threadId: 'test-thread-4',
    });

    log('yellow', `  Error: ${response.data.error}`);
    assert(response.status === 400, 'Expected status 400');
    assert(response.data.error === 'Message is required', 'Expected "Message is required" error');
  });

  // Test 7: Thread ID persistence
  await runTest('Thread ID is preserved across multiple messages', async () => {
    const threadId = `test-thread-${Date.now()}`;

    // First message
    const response1 = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      message: 'First message',
      accessToken: 'demo-token',
      threadId,
    });

    // Second message in same thread
    const response2 = await makeRequest({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      message: 'Second message',
      accessToken: 'demo-token',
      threadId,
    });

    log('yellow', `  Thread ID: ${response1.data.threadId}`);
    assert(response1.data.threadId === threadId, 'First response should preserve thread ID');
    assert(response2.data.threadId === threadId, 'Second response should preserve thread ID');
  });

  // Print summary
  log('blue', '\n========================================');
  log('blue', 'Test Results Summary');
  log('blue', '========================================');
  log('cyan', `Total Tests: ${passedTests + failedTests}`);
  log('green', `Passed: ${passedTests}`);
  if (failedTests > 0) {
    log('red', `Failed: ${failedTests}`);
  } else {
    log('green', `Failed: ${failedTests}`);
  }
  log('blue', '========================================\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((error) => {
  log('red', `\nFatal error: ${error.message}`);
  process.exit(1);
});
