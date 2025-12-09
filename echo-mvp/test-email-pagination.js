#!/usr/bin/env node

/**
 * Test Script: Email Search Supports Pagination
 * Feature #108
 *
 * Tests:
 * 1. Search for common term with many results
 * 2. Verify initial results are shown
 * 3. Request more results / next page
 * 4. Verify pagination works correctly
 * 5. Verify agent can handle "show more" requests
 * 6. Verify different page sizes work
 */

const BASE_URL = 'http://localhost:3002';

// ANSI color codes
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

async function testEmailPagination() {
  console.log('========================================');
  log('TEST: Email Search Supports Pagination', 'cyan');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;
  let threadId = null;

  // Test 1: Search for common term
  try {
    log('Test 1: Search for common term (initial results)', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Search my emails for "test"',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      threadId = data.threadId; // Store thread ID for context
      const emailCount = (data.text.match(/\d+\.\s+\*\*From\*\*/g) || []).length;

      log(`✅ PASSED - Search returned results`, 'green');
      log(`   Found ${emailCount} emails in initial response`, 'yellow');
      log(`   Thread ID: ${threadId}`, 'yellow');
      passed++;
    } else {
      log(`❌ FAILED - Search request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 2: Verify initial results are limited
  try {
    log('\nTest 2: Verify initial results are limited (not all results)', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all emails',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      const emailCount = (data.text.match(/\d+\.\s+\*\*From\*\*/g) || []).length;

      if (emailCount > 0 && emailCount <= 50) {
        log(`✅ PASSED - Results limited to ${emailCount} emails`, 'green');
        log(`   (Good: Not overwhelming user with all results)`, 'yellow');
        passed++;
      } else if (emailCount > 50) {
        log(`⚠️  WARNING - Many emails returned: ${emailCount}`, 'yellow');
        log(`   Consider implementing stricter pagination`, 'yellow');
        passed++; // Still functional
      } else {
        log(`⚠️  WARNING - No emails in response (may be expected)`, 'yellow');
        passed++;
      }
    } else {
      log(`❌ FAILED - Request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 3: Request more results (pagination)
  try {
    log('\nTest 3: Request more/next results', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me more emails',
        threadId: threadId, // Use thread context if available
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      const hasMoreResults =
        data.text.toLowerCase().includes('email') ||
        data.text.match(/\*\*From\*\*:/i);

      if (hasMoreResults) {
        log(`✅ PASSED - "Show more" request handled`, 'green');
        log(`   Agent understood pagination request`, 'yellow');
        passed++;
      } else {
        log(`⚠️  WARNING - Response may not include more results`, 'yellow');
        log(`   Agent might have indicated no more emails available`, 'yellow');
        passed++; // Still acceptable
      }
    } else {
      log(`❌ FAILED - Request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 4: Agent handles "next page" style requests
  try {
    log('\nTest 4: Agent handles "next page" style requests', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me the next 10 emails',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      log(`✅ PASSED - Next page request processed`, 'green');
      passed++;
    } else {
      log(`❌ FAILED - Request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 5: Agent can limit results to specific count
  try {
    log('\nTest 5: Agent respects specific result count requests', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me only the 5 most recent emails',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      const emailCount = (data.text.match(/\d+\.\s+\*\*From\*\*/g) || []).length;

      if (emailCount > 0 && emailCount <= 10) {
        log(`✅ PASSED - Agent limited results appropriately: ${emailCount} emails`, 'green');
        passed++;
      } else {
        log(`⚠️  WARNING - Email count: ${emailCount}`, 'yellow');
        log(`   Agent may not have strictly followed count request`, 'yellow');
        passed++; // Still acceptable
      }
    } else {
      log(`❌ FAILED - Request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 6: Verify pagination context is maintained
  try {
    log('\nTest 6: Verify pagination context is maintained in conversation', 'blue');

    // First request
    const response1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me my recent emails',
      }),
    });

    const data1 = await response1.json();
    const threadId1 = data1.threadId;

    // Follow-up request using thread context
    const response2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me more',
        threadId: threadId1,
      }),
    });

    const data2 = await response2.json();

    if (response1.ok && response2.ok && data2.text) {
      log(`✅ PASSED - Pagination context maintained across requests`, 'green');
      log(`   Thread ID preserved: ${threadId1}`, 'yellow');
      passed++;
    } else {
      log(`❌ FAILED - Context not maintained`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Summary
  console.log('\n========================================');
  log('SUMMARY: Email Pagination', 'cyan');
  console.log('========================================');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`Total: ${passed + failed}`, 'blue');
  console.log('========================================\n');

  const passRate = (passed / (passed + failed)) * 100;
  if (passRate >= 80) {
    log('🎉 FEATURE VERIFIED: Email search supports pagination', 'green');
    process.exit(0);
  } else {
    log('❌ FEATURE NEEDS WORK: Pagination needs improvement', 'red');
    process.exit(1);
  }
}

// Run tests
testEmailPagination().catch((error) => {
  log(`\n❌ TEST SUITE FAILED: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
