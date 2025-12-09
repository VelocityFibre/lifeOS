#!/usr/bin/env node

/**
 * Test Concurrent Request Handling
 * Verifies the backend can handle multiple simultaneous requests
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3002';

// ANSI color codes
const colors = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const startTime = Date.now();

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data, duration });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, duration });
        }
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({ error, duration });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`${colors.blue}\n========================================${colors.reset}`);
  console.log(`${colors.blue}Concurrent Request Handling Test${colors.reset}`);
  console.log(`${colors.blue}========================================\n${colors.reset}`);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Send 5 requests simultaneously
  console.log(`${colors.cyan}\nTest 1: Handle 5 simultaneous requests${colors.reset}`);
  try {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        makeRequest('POST', '/api/chat', {
          message: `Test concurrent request ${i + 1}: Show my unread emails`,
          threadId: `concurrent-${i}-${Date.now()}`,
        })
      );
    }

    console.log(`${colors.yellow}  Sending 5 requests simultaneously...${colors.reset}`);
    const responses = await Promise.all(requests);

    const allSuccessful = responses.every(r => r.status === 200 && r.data.success);
    const avgDuration = responses.reduce((sum, r) => sum + r.duration, 0) / responses.length;

    console.log(`${colors.yellow}  All requests completed${colors.reset}`);
    console.log(`${colors.yellow}  Average response time: ${avgDuration.toFixed(0)}ms${colors.reset}`);
    console.log(`${colors.yellow}  Min: ${Math.min(...responses.map(r => r.duration))}ms${colors.reset}`);
    console.log(`${colors.yellow}  Max: ${Math.max(...responses.map(r => r.duration))}ms${colors.reset}`);

    if (allSuccessful) {
      console.log(`${colors.green}✅ PASSED - All requests processed successfully${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Some requests failed${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Test 2: Verify no race conditions (all responses are unique)
  console.log(`${colors.cyan}\nTest 2: Verify unique responses (no race conditions)${colors.reset}`);
  try {
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(
        makeRequest('POST', '/api/chat', {
          message: `Unique request ${i + 1}`,
          threadId: `race-test-${i}-${Date.now()}`,
        })
      );
    }

    const responses = await Promise.all(requests);

    // Check that thread IDs are preserved (no cross-contamination)
    const threadIds = responses.map(r => r.data.threadId);
    const uniqueThreads = new Set(threadIds);

    console.log(`${colors.yellow}  Thread IDs returned: ${threadIds.length}${colors.reset}`);
    console.log(`${colors.yellow}  Unique thread IDs: ${uniqueThreads.size}${colors.reset}`);

    if (uniqueThreads.size === threadIds.length) {
      console.log(`${colors.green}✅ PASSED - No race conditions detected${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Race condition detected${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Test 3: All responses contain correct data
  console.log(`${colors.cyan}\nTest 3: All responses contain correct data${colors.reset}`);
  try {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        makeRequest('POST', '/api/chat', {
          message: 'List my unread emails',
          threadId: `data-test-${i}-${Date.now()}`,
        })
      );
    }

    const responses = await Promise.all(requests);

    const allHaveText = responses.every(r => r.data.text && r.data.text.length > 0);
    const allHaveSuccess = responses.every(r => r.data.success === true);

    console.log(`${colors.yellow}  Responses with text: ${responses.filter(r => r.data.text).length}/5${colors.reset}`);
    console.log(`${colors.yellow}  Responses with success: ${responses.filter(r => r.data.success).length}/5${colors.reset}`);

    if (allHaveText && allHaveSuccess) {
      console.log(`${colors.green}✅ PASSED - All responses contain correct data${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Some responses missing data${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Test 4: Server remains responsive after concurrent load
  console.log(`${colors.cyan}\nTest 4: Server remains responsive after load${colors.reset}`);
  try {
    // Send a single request after the concurrent load
    const response = await makeRequest('POST', '/api/chat', {
      message: 'Check if server is still responsive',
      threadId: `responsive-test-${Date.now()}`,
    });

    console.log(`${colors.yellow}  Response status: ${response.status}${colors.reset}`);
    console.log(`${colors.yellow}  Response time: ${response.duration}ms${colors.reset}`);

    if (response.status === 200 && response.data.success) {
      console.log(`${colors.green}✅ PASSED - Server remains responsive${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Server not responsive${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Summary
  console.log(`${colors.blue}\n========================================${colors.reset}`);
  console.log(`${colors.blue}Test Results Summary${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.cyan}Total Tests: ${passedTests + failedTests}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.blue}========================================\n${colors.reset}`);

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests();
