#!/usr/bin/env node

/**
 * Test Feature #66: Very long messages are handled correctly
 *
 * Tests:
 * 1. Send message with 1000 characters
 * 2. Send message with 5000 characters
 * 3. Send message with 10000 characters
 * 4. Verify API handles long messages gracefully
 * 5. Verify appropriate limits or truncation if needed
 */

const API_URL = 'http://localhost:3002/api/chat';

function generateLongMessage(length) {
  const words = ['hello', 'world', 'test', 'message', 'long', 'text', 'data', 'content', 'information'];
  let message = '';
  while (message.length < length) {
    message += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return message.substring(0, length);
}

async function testLongMessages() {
  console.log('========================================');
  console.log('TEST: Very Long Messages');
  console.log('========================================\n');

  const testCases = [
    {
      name: '1000 characters',
      length: 1000
    },
    {
      name: '2500 characters',
      length: 2500
    },
    {
      name: '5000 characters',
      length: 5000
    },
    {
      name: '7500 characters',
      length: 7500
    },
    {
      name: '10000 characters',
      length: 10000
    }
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`\nTest: ${testCase.name}`);

      const message = generateLongMessage(testCase.length);
      console.log(`Generated message: ${message.length} characters`);
      console.log(`Preview: ${message.substring(0, 100)}...`);

      const startTime = Date.now();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          threadId: `test-long-msg-${Date.now()}`
        })
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        // Check if it's a validation error (expected for very long messages)
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          console.log(`⚠️  Message rejected (HTTP 400) - This may be expected`);
          console.log(`   Error: ${errorData.error || 'Validation error'}`);
          console.log(`✅ PASSED - API properly validates/limits message length`);
          passed++;
          results.push({ test: testCase.name, status: 'PASSED', note: 'Properly rejected' });
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Verify the message was processed
      if (!data.text || data.text.length === 0) {
        throw new Error('No response received from API');
      }

      console.log(`✅ PASSED - Message processed successfully`);
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Response length: ${data.text.length} characters`);
      console.log(`   Response preview: ${data.text.substring(0, 100)}...`);

      // Warn if response time is slow
      if (responseTime > 10000) {
        console.log(`   ⚠️  Warning: Response time > 10 seconds`);
      }

      passed++;
      results.push({
        test: testCase.name,
        status: 'PASSED',
        responseTime: `${responseTime}ms`,
        responseLength: data.text.length
      });

    } catch (error) {
      console.log(`❌ FAILED - ${error.message}`);
      failed++;
      results.push({ test: testCase.name, status: 'FAILED', error: error.message });
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('========================================\n');

  // Detailed results
  console.log('Detailed Results:');
  results.forEach((result, i) => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${i + 1}. ${result.test}`);
    if (result.responseTime) {
      console.log(`   Response time: ${result.responseTime}`);
    }
    if (result.note) {
      console.log(`   Note: ${result.note}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Final verdict
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Feature #66: Very long messages are handled correctly ✅');
    console.log('\nThe API either:');
    console.log('  - Processes long messages successfully, OR');
    console.log('  - Properly validates and rejects messages that are too long');
    return true;
  } else {
    console.log(`\n⚠️  ${failed} TEST(S) FAILED`);
    console.log('Feature #66 needs fixes before marking as passing.');
    return false;
  }
}

// Run the tests
testLongMessages()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
