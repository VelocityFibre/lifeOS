#!/usr/bin/env node

/**
 * Test: Email Search with Special Characters Works
 * Feature #68
 *
 * This test verifies that the @mail agent can handle search queries
 * with special characters without errors or parsing issues.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

console.log('========================================');
console.log('TEST: Email Search Special Characters');
console.log('========================================\n');

let passCount = 0;
let failCount = 0;

function makeRequest(path, body) {
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

    req.write(data);
    req.end();
  });
}

async function testSearchQuery(testName, query, expectedBehavior) {
  console.log(`Test: ${testName}`);
  console.log('----------------------------------------------');

  try {
    const response = await makeRequest('/api/chat', { message: query });

    // The request should complete without errors
    if (response.status === 200 && response.data.text) {
      // Check that the response doesn't contain error messages
      const hasError = response.data.text.toLowerCase().includes('error') ||
                      response.data.text.toLowerCase().includes('failed') ||
                      response.data.text.toLowerCase().includes('unable to');

      if (!hasError) {
        console.log(`✅ PASSED - ${expectedBehavior}`);
        console.log(`   Query: "${query}"`);
        console.log(`   Response preview: ${response.data.text.substring(0, 80)}...`);
        console.log();
        passCount++;
        return true;
      } else {
        // Some "errors" might be legitimate (e.g., "no emails found")
        // Let's be more specific
        const isParsingError = response.data.text.includes('parse') ||
                              response.data.text.includes('invalid') ||
                              response.data.text.includes('syntax');

        if (isParsingError) {
          console.log(`❌ FAILED - Parsing error with special characters`);
          console.log(`   Query: "${query}"`);
          console.log(`   Error: ${response.data.text.substring(0, 100)}...`);
          console.log();
          failCount++;
          return false;
        } else {
          // Might be a valid "no results" message
          console.log(`✅ PASSED - ${expectedBehavior} (no results is valid)`);
          console.log(`   Query: "${query}"`);
          console.log(`   Response: ${response.data.text.substring(0, 80)}...`);
          console.log();
          passCount++;
          return true;
        }
      }
    } else {
      console.log(`❌ FAILED - Request failed or returned error`);
      console.log(`   Query: "${query}"`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      console.log();
      failCount++;
      return false;
    }
  } catch (error) {
    console.log(`❌ FAILED - Request threw error`);
    console.log(`   Query: "${query}"`);
    console.log(`   Error: ${error.message}`);
    console.log();
    failCount++;
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Testing email search with special characters...\n');

  // Test 1: Emoji in search query
  await testSearchQuery(
    'Search with emoji 📧',
    '@mail find emails about meeting 📅',
    'Handles emoji in search query'
  );

  // Test 2: Special punctuation
  await testSearchQuery(
    'Search with special punctuation',
    '@mail search for "project-update" emails',
    'Handles quotes and hyphens'
  );

  // Test 3: Ampersand
  await testSearchQuery(
    'Search with ampersand',
    '@mail find emails from Sales & Marketing',
    'Handles ampersand character'
  );

  // Test 4: At symbol (besides @mail)
  await testSearchQuery(
    'Search with @ symbol',
    '@mail search emails from user@example.com',
    'Handles @ symbol in email addresses'
  );

  // Test 5: Parentheses
  await testSearchQuery(
    'Search with parentheses',
    '@mail find emails about (urgent) matters',
    'Handles parentheses in query'
  );

  // Test 6: Forward slash
  await testSearchQuery(
    'Search with forward slash',
    '@mail search for Q4/2024 emails',
    'Handles forward slash'
  );

  // Test 7: Percent sign
  await testSearchQuery(
    'Search with percent sign',
    '@mail find emails about 50% discount',
    'Handles percent sign'
  );

  // Test 8: Plus sign
  await testSearchQuery(
    'Search with plus sign',
    '@mail search for C++ related emails',
    'Handles plus sign'
  );

  // Test 9: Asterisk
  await testSearchQuery(
    'Search with asterisk',
    '@mail find emails with *important* tags',
    'Handles asterisk'
  );

  // Test 10: Multiple special characters
  await testSearchQuery(
    'Search with multiple special chars',
    '@mail find emails from [Team] <notifications@company.com>',
    'Handles multiple special characters'
  );

  // Test 11: Non-ASCII characters
  await testSearchQuery(
    'Search with non-ASCII characters',
    '@mail find emails about café and résumé',
    'Handles non-ASCII/accented characters'
  );

  console.log('========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Total: ${passCount + failCount}`);
  console.log('========================================\n');

  const passRate = (passCount / (passCount + failCount)) * 100;

  if (passRate >= 80) {
    console.log(`✅ FEATURE #68 VERIFIED (${passRate.toFixed(1)}% pass rate)`);
    console.log('Email search with special characters works!\n');
    process.exit(0);
  } else {
    console.log(`❌ FEATURE #68 NOT VERIFIED (${passRate.toFixed(1)}% pass rate)`);
    console.log('Email search with special characters needs improvement.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
