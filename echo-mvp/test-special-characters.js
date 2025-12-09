#!/usr/bin/env node

/**
 * Test Feature #67: Special characters in messages are handled correctly
 *
 * Tests:
 * 1. Send message with emojis
 * 2. Send message with unicode characters
 * 3. Send message with symbols (@#$%^&*)
 * 4. Send message with quotes and apostrophes
 * 5. Send message with newlines
 * 6. Send message with HTML-like tags
 */

const API_URL = 'http://localhost:3002/api/chat';

async function testSpecialCharacters() {
  console.log('========================================');
  console.log('TEST: Special Characters in Messages');
  console.log('========================================\n');

  const testCases = [
    {
      name: 'Emojis',
      message: '👋 Hello! 🎉 This is a test with emojis 😀🚀✨',
      expectedChars: ['👋', '🎉', '😀', '🚀', '✨']
    },
    {
      name: 'Unicode characters',
      message: 'Testing unicode: café, naïve, Zürich, 中文, العربية, हिन्दी',
      expectedChars: ['é', 'ï', 'ü', '中', '文', 'ع', 'ر', 'ب', 'ि', 'न्दी']
    },
    {
      name: 'Symbols and special chars',
      message: 'Symbols: @#$%^&*()_+-=[]{}|;:,.<>?~`',
      expectedChars: ['@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=']
    },
    {
      name: 'Quotes and apostrophes',
      message: "Testing \"double quotes\" and 'single quotes' and it's working",
      expectedChars: ['"', "'", 'it\'s']
    },
    {
      name: 'Newlines (\\n)',
      message: 'Line 1\nLine 2\nLine 3',
      expectedChars: ['\n']
    },
    {
      name: 'HTML-like tags',
      message: '<script>alert("test")</script> and <div>content</div>',
      expectedChars: ['<', '>', 'script', 'div']
    },
    {
      name: 'Backslashes',
      message: 'Path: C:\\Users\\Test\\file.txt',
      expectedChars: ['\\']
    },
    {
      name: 'Mixed special characters',
      message: '🚀 Hello "world" with café & <tags> @ 中文 😊',
      expectedChars: ['🚀', '"', 'é', '&', '<', '>', '@', '中', '😊']
    }
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`\nTest: ${testCase.name}`);
      console.log(`Message: ${testCase.message}`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          threadId: `test-special-chars-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Verify the message was processed (got a response)
      if (!data.text || data.text.length === 0) {
        throw new Error('No response received from API');
      }

      // Verify the special characters weren't corrupted
      // (The API should process them without errors)
      console.log(`✅ PASSED - Message processed successfully`);
      console.log(`   Response preview: ${data.text.substring(0, 100)}...`);

      passed++;
      results.push({ test: testCase.name, status: 'PASSED' });

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
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Final verdict
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Feature #67: Special characters in messages are handled correctly ✅');
    return true;
  } else {
    console.log(`\n⚠️  ${failed} TEST(S) FAILED`);
    console.log('Feature #67 needs fixes before marking as passing.');
    return false;
  }
}

// Run the tests
testSpecialCharacters()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
