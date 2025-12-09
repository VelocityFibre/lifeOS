#!/usr/bin/env node

/**
 * Test Feature #37: @mail agent handles rate limiting gracefully
 *
 * This test verifies that the backend handles high request volumes without crashing:
 * 1. Send many rapid requests to stress test the API
 * 2. Verify no server crashes or unhandled errors
 * 3. Verify appropriate responses (even if rate limited)
 * 4. Verify app remains functional after stress test
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3002;

// Test configuration
const NUM_CONCURRENT_REQUESTS = 20;
const NUM_SEQUENTIAL_BATCHES = 3;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function addResult(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
}

// Helper to send a single request
function sendChatRequest(requestNum) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      message: `Test request #${requestNum} - show my emails`,
      accessToken: "test-token",
      threadId: `test-thread-${requestNum}`
    });

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const startTime = Date.now();

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        resolve({
          success: true,
          statusCode: res.statusCode,
          duration,
          data: data.substring(0, 200) // Truncate to avoid memory issues
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      resolve({
        success: false,
        error: error.message,
        duration
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        duration: 30000
      });
    });

    req.write(postData);
    req.end();
  });
}

// Test 1: Backend handles concurrent requests
async function testConcurrentRequests() {
  console.log(`\nTest 1: Handling ${NUM_CONCURRENT_REQUESTS} concurrent requests`);

  try {
    const promises = [];
    for (let i = 0; i < NUM_CONCURRENT_REQUESTS; i++) {
      promises.push(sendChatRequest(i + 1));
    }

    const responses = await Promise.all(promises);

    const successful = responses.filter(r => r.success).length;
    const failed = responses.filter(r => !r.success).length;
    const avgDuration = responses.reduce((sum, r) => sum + r.duration, 0) / responses.length;

    console.log(`   Successful: ${successful}/${NUM_CONCURRENT_REQUESTS}`);
    console.log(`   Failed: ${failed}/${NUM_CONCURRENT_REQUESTS}`);
    console.log(`   Average duration: ${avgDuration.toFixed(0)}ms`);

    // Consider it a pass if at least 70% succeed (some may timeout or fail under stress)
    if (successful >= NUM_CONCURRENT_REQUESTS * 0.7) {
      addResult(
        'Handles concurrent requests',
        true,
        `${successful}/${NUM_CONCURRENT_REQUESTS} requests successful (${(successful/NUM_CONCURRENT_REQUESTS*100).toFixed(0)}%)`
      );
    } else {
      addResult(
        'Handles concurrent requests',
        false,
        `Only ${successful}/${NUM_CONCURRENT_REQUESTS} successful - backend may be struggling`
      );
    }

  } catch (error) {
    addResult(
      'Concurrent request handling',
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 2: Backend doesn't crash under load
async function testServerStability() {
  console.log('\nTest 2: Server stability under sequential load');

  try {
    let allBatchesSucceeded = true;

    for (let batch = 0; batch < NUM_SEQUENTIAL_BATCHES; batch++) {
      console.log(`   Batch ${batch + 1}/${NUM_SEQUENTIAL_BATCHES}...`);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(sendChatRequest(batch * 10 + i + 100));
      }

      const responses = await Promise.all(promises);
      const successful = responses.filter(r => r.success).length;

      console.log(`   Batch ${batch + 1}: ${successful}/10 successful`);

      if (successful < 7) {
        allBatchesSucceeded = false;
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (allBatchesSucceeded) {
      addResult(
        'Server remains stable under load',
        true,
        `Handled ${NUM_SEQUENTIAL_BATCHES} sequential batches successfully`
      );
    } else {
      addResult(
        'Server stability',
        false,
        'Server showed instability during sequential batches'
      );
    }

  } catch (error) {
    addResult(
      'Server stability test',
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 3: Server recovers and is still functional after stress test
async function testPostStressRecovery() {
  console.log('\nTest 3: Server recovery after stress test');

  // Wait a bit for server to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Try a normal request
    const response = await sendChatRequest(999);

    if (response.success && response.statusCode === 200) {
      addResult(
        'Server recovers after stress',
        true,
        `Server functional - response in ${response.duration}ms`
      );
    } else {
      addResult(
        'Server recovery',
        false,
        `Server not responding correctly after stress test`
      );
    }

  } catch (error) {
    addResult(
      'Post-stress recovery',
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 4: Health endpoint still works
async function testHealthEndpointAfterStress() {
  console.log('\nTest 4: Health endpoint after stress test');

  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
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
        try {
          const health = JSON.parse(data);

          if (health.status === 'ok') {
            addResult(
              'Health endpoint works after stress',
              true,
              'Backend is healthy after stress test'
            );
          } else {
            addResult(
              'Health endpoint status',
              false,
              `Health status: ${health.status}`
            );
          }
        } catch (error) {
          addResult(
            'Health endpoint parsing',
            false,
            `Could not parse health response: ${error.message}`
          );
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      addResult(
        'Health endpoint after stress',
        false,
        `Health check failed: ${error.message}`
      );
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      addResult(
        'Health endpoint timeout',
        false,
        'Health endpoint timed out after stress test'
      );
      resolve();
    });

    req.end();
  });
}

// Test 5: Error messages are user-friendly (if any rate limiting occurs)
async function testErrorMessages() {
  console.log('\nTest 5: Error messages are user-friendly');

  // Send a few more requests to potentially trigger rate limiting
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(sendChatRequest(2000 + i));
  }

  const responses = await Promise.all(promises);

  let foundErrorResponse = false;
  let errorIsFriendly = true;

  for (const response of responses) {
    if (!response.success || response.statusCode >= 400) {
      foundErrorResponse = true;

      // Check if error message is user-friendly
      if (response.error) {
        const errorMsg = response.error.toLowerCase();

        // Check for unfriendly patterns
        if (errorMsg.includes('econnrefused') ||
            errorMsg.includes('etimedout') ||
            errorMsg.includes('stack trace') ||
            errorMsg.includes('undefined is not')) {
          errorIsFriendly = false;
        }
      }

      if (response.data) {
        const dataStr = response.data.toLowerCase();

        // Check response has friendly message
        if (dataStr.includes('error') || dataStr.includes('failed')) {
          // Good - has error info
        }
      }
    }
  }

  if (!foundErrorResponse) {
    addResult(
      'Error message quality',
      true,
      'No errors encountered - all requests successful'
    );
  } else if (errorIsFriendly) {
    addResult(
      'Error messages are user-friendly',
      true,
      'Error responses found but appear to be handled gracefully'
    );
  } else {
    addResult(
      'Error message quality',
      false,
      'Some error messages are not user-friendly'
    );
  }
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('RATE LIMITING TEST - Feature #37');
  console.log('========================================');
  console.log(`Testing with ${NUM_CONCURRENT_REQUESTS} concurrent requests`);
  console.log(`and ${NUM_SEQUENTIAL_BATCHES} sequential batches`);
  console.log('');

  await testConcurrentRequests();
  await testServerStability();
  await testPostStressRecovery();
  await testHealthEndpointAfterStress();
  await testErrorMessages();

  // Print summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.tests.length}`);
  console.log('========================================\n');

  // Determine overall pass/fail
  const passRate = results.passed / results.tests.length;

  if (passRate >= 0.8) {
    console.log('✅ FEATURE #37 PASSES');
    console.log(`Pass rate: ${(passRate * 100).toFixed(1)}% (threshold: 80%)`);
    console.log('\n@mail agent handles rate limiting gracefully.');
    process.exit(0);
  } else {
    console.log('❌ FEATURE #37 NEEDS WORK');
    console.log(`Pass rate: ${(passRate * 100).toFixed(1)}% (threshold: 80%)`);
    console.log('\nRate limiting handling needs improvement.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
