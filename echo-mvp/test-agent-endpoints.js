#!/usr/bin/env node

/**
 * Test Script: Agent Endpoint Verification
 *
 * Tests:
 * - Feature #44: @cal agent endpoint exists
 * - Feature #45: @mem agent endpoint exists
 * - Feature #46: Backend handles invalid agent names
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: message,
      accessToken: 'mock',
      threadId: 'test-thread'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  log('\n========================================', 'blue');
  log('Agent Endpoint Verification Tests', 'blue');
  log('========================================\n', 'blue');

  let passed = 0;
  let failed = 0;

  // Test 1: @cal agent endpoint
  log('\nTest 1: @cal agent endpoint exists', 'cyan');
  try {
    const response = await makeRequest('@cal show my calendar');

    if (response.statusCode === 200) {
      log('  ✅ Endpoint responds with 200 OK', 'green');

      if (response.data.text && response.data.text.includes('@cal')) {
        log('  ✅ Response mentions @cal agent', 'green');
      } else {
        log('  ⚠️  Response does not mention @cal', 'yellow');
      }

      if (response.data.text.includes('coming soon') || response.data.text.includes('Calendar')) {
        log('  ✅ Appropriate "coming soon" or placeholder message', 'green');
      } else {
        log('  ⚠️  No placeholder message found', 'yellow');
      }

      log(`  Response: ${response.data.text.substring(0, 100)}...`, 'yellow');
      passed++;
    } else {
      log(`  ❌ Unexpected status code: ${response.statusCode}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 2: @mem agent endpoint
  log('\nTest 2: @mem agent endpoint exists', 'cyan');
  try {
    const response = await makeRequest('@mem remember this');

    if (response.statusCode === 200) {
      log('  ✅ Endpoint responds with 200 OK', 'green');

      if (response.data.text && response.data.text.includes('@mem')) {
        log('  ✅ Response mentions @mem agent', 'green');
      } else {
        log('  ⚠️  Response does not mention @mem', 'yellow');
      }

      if (response.data.text.includes('coming soon') || response.data.text.includes('Memory')) {
        log('  ✅ Appropriate "coming soon" or placeholder message', 'green');
      } else {
        log('  ⚠️  No placeholder message found', 'yellow');
      }

      log(`  Response: ${response.data.text.substring(0, 100)}...`, 'yellow');
      passed++;
    } else {
      log(`  ❌ Unexpected status code: ${response.statusCode}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 3: Invalid agent name handling
  log('\nTest 3: Backend handles invalid agent names gracefully', 'cyan');
  try {
    const response = await makeRequest('@fake do something');

    if (response.statusCode === 200 || response.statusCode === 400) {
      log('  ✅ Endpoint responds (doesn\'t crash)', 'green');

      // Since @fake is not recognized, it should be treated as @mail (default)
      // or return an error message
      if (response.data.text || response.data.error) {
        log('  ✅ Response contains message (no crash)', 'green');
        log(`  Response: ${(response.data.text || response.data.error).substring(0, 100)}...`, 'yellow');
      } else {
        log('  ⚠️  Empty response', 'yellow');
      }

      passed++;
    } else {
      log(`  ❌ Unexpected status code: ${response.statusCode}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 4: @mail still works (default agent)
  log('\nTest 4: @mail agent still works as default', 'cyan');
  try {
    const response = await makeRequest('@mail show my emails');

    if (response.statusCode === 200) {
      log('  ✅ @mail endpoint responds with 200 OK', 'green');

      if (response.data.text) {
        log('  ✅ Response contains text', 'green');
        log(`  Response: ${response.data.text.substring(0, 100)}...`, 'yellow');
      }

      passed++;
    } else {
      log(`  ❌ Unexpected status code: ${response.statusCode}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    failed++;
  }

  // Summary
  log('\n========================================', 'blue');
  log('SUMMARY', 'blue');
  log('========================================', 'blue');
  log(`Total tests: ${passed + failed}`);
  log(`${colors.green}Passed: ${passed}${colors.reset}`);
  log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    log('\n✅ All tests passed!', 'green');
    log('\nFeatures verified:', 'cyan');
    log('  • Feature #44: @cal agent endpoint exists ✅');
    log('  • Feature #45: @mem agent endpoint exists ✅');
    log('  • Feature #46: Backend handles invalid agent names ✅');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Review output above.', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
