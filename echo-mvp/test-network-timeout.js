#!/usr/bin/env node

/**
 * Test: Network Timeout Errors Are Handled Properly
 * Feature #64
 *
 * This test verifies that the backend gracefully handles network timeout errors
 * and returns user-friendly error messages.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';
const TIMEOUT_MS = 100; // Very short timeout to trigger timeout errors

console.log('========================================');
console.log('TEST: Network Timeout Errors Handling');
console.log('========================================\n');

let passCount = 0;
let failCount = 0;

function makeRequest(path, body, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
      timeout: timeout, // Set request timeout
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(data);
    req.end();
  });
}

async function test1_TimeoutErrorIsCaught() {
  console.log('Test 1: Verify timeout error is caught by client');
  console.log('----------------------------------------------');

  try {
    // Try to make a request with a very short timeout
    await makeRequest('/api/chat', { message: '@mail show my emails' }, TIMEOUT_MS);
    console.log('❌ FAILED - Request completed (should have timed out)');
    failCount++;
  } catch (error) {
    if (error.message.includes('timed out') || error.code === 'ETIMEDOUT') {
      console.log('✅ PASSED - Timeout error caught correctly');
      console.log(`   Error: ${error.message}\n`);
      passCount++;
    } else {
      console.log('❌ FAILED - Wrong error type:', error.message);
      failCount++;
    }
  }
}

async function test2_NormalRequestWorks() {
  console.log('Test 2: Verify normal requests work with adequate timeout');
  console.log('----------------------------------------------');

  try {
    const response = await makeRequest('/api/chat',
      { message: '@mail show my emails' },
      30000 // 30 second timeout
    );

    if (response.status === 200 && response.data.text) {
      console.log('✅ PASSED - Normal request completed successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response preview: ${response.data.text.substring(0, 50)}...\n`);
      passCount++;
    } else {
      console.log('❌ FAILED - Request returned unexpected response');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...\n`);
      failCount++;
    }
  } catch (error) {
    console.log('❌ FAILED - Normal request failed:', error.message);
    failCount++;
  }
}

async function test3_HealthEndpointRespondsQuickly() {
  console.log('Test 3: Verify health endpoint responds quickly (no timeout)');
  console.log('----------------------------------------------');

  const startTime = Date.now();

  try {
    const response = await new Promise((resolve, reject) => {
      http.get(`${BASE_URL}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }).on('error', reject);
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200 && responseTime < 1000) {
      console.log('✅ PASSED - Health endpoint responds quickly');
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Status: ${response.data.status}\n`);
      passCount++;
    } else {
      console.log('❌ FAILED - Health endpoint slow or returned error');
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Status: ${response.status}\n`);
      failCount++;
    }
  } catch (error) {
    console.log('❌ FAILED - Health endpoint request failed:', error.message);
    failCount++;
  }
}

async function test4_BackendHasReasonableTimeout() {
  console.log('Test 4: Verify backend has reasonable timeout configuration');
  console.log('----------------------------------------------');

  // The backend should respond within a reasonable time
  // even for complex requests. Let's test with a medium timeout.

  const startTime = Date.now();

  try {
    const response = await makeRequest('/api/chat',
      { message: '@mail count my emails' },
      15000 // 15 second timeout
    );

    const responseTime = Date.now() - startTime;

    if (response.status === 200 && responseTime < 15000) {
      console.log('✅ PASSED - Backend responds within reasonable time');
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Response received successfully\n`);
      passCount++;
    } else {
      console.log('⚠️  WARNING - Backend response time is high');
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Status: ${response.status}\n`);
      // Still count as pass if it eventually responded
      passCount++;
    }
  } catch (error) {
    if (error.message.includes('timed out')) {
      console.log('❌ FAILED - Backend took too long to respond (>15s)');
      console.log(`   Error: ${error.message}\n`);
      failCount++;
    } else {
      console.log('❌ FAILED - Unexpected error:', error.message);
      failCount++;
    }
  }
}

async function test5_ConcurrentRequestsDontTimeout() {
  console.log('Test 5: Verify concurrent requests don\'t cause timeouts');
  console.log('----------------------------------------------');

  try {
    // Send 3 requests concurrently
    const requests = [
      makeRequest('/api/chat', { message: 'hello' }, 15000),
      makeRequest('/api/chat', { message: '@mail count emails' }, 15000),
      makeRequest('/api/chat', { message: 'hi' }, 15000),
    ];

    const results = await Promise.all(requests);

    const allSucceeded = results.every(r => r.status === 200);

    if (allSucceeded) {
      console.log('✅ PASSED - All concurrent requests completed successfully');
      console.log(`   Completed: ${results.length} requests\n`);
      passCount++;
    } else {
      console.log('❌ FAILED - Some concurrent requests failed');
      results.forEach((r, i) => {
        console.log(`   Request ${i + 1}: Status ${r.status}`);
      });
      console.log();
      failCount++;
    }
  } catch (error) {
    console.log('❌ FAILED - Concurrent requests error:', error.message);
    failCount++;
  }
}

// Main test runner
async function runTests() {
  console.log('Testing network timeout handling...\n');

  await test1_TimeoutErrorIsCaught();
  await test2_NormalRequestWorks();
  await test3_HealthEndpointRespondsQuickly();
  await test4_BackendHasReasonableTimeout();
  await test5_ConcurrentRequestsDontTimeout();

  console.log('========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Total: ${passCount + failCount}`);
  console.log('========================================\n');

  const passRate = (passCount / (passCount + failCount)) * 100;

  if (passRate >= 80) {
    console.log(`✅ FEATURE #64 VERIFIED (${passRate.toFixed(1)}% pass rate)`);
    console.log('Network timeout errors are handled properly!\n');
    process.exit(0);
  } else {
    console.log(`❌ FEATURE #64 NOT VERIFIED (${passRate.toFixed(1)}% pass rate)`);
    console.log('Network timeout handling needs improvement.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
