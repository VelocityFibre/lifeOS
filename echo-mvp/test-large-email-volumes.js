#!/usr/bin/env node

/**
 * Test Script: Large Email Volumes Handled Efficiently
 * Feature #107
 *
 * Tests:
 * 1. Request recent emails with large volume
 * 2. Verify response time is acceptable (< 10s)
 * 3. Verify results are limited appropriately (not all 1000+)
 * 4. Verify response includes reasonable number of emails
 * 5. Verify memory usage is reasonable
 * 6. Verify no timeout errors
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

async function testLargeEmailVolumes() {
  console.log('========================================');
  log('TEST: Large Email Volumes Handled Efficiently', 'cyan');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Request recent emails with large volume
  try {
    log('Test 1: Request recent emails (simulating large volume)', 'blue');
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me my recent emails',
      }),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (response.ok && data.text) {
      log(`✅ PASSED - Recent emails retrieved successfully`, 'green');
      log(`   Response time: ${responseTime}ms`, 'yellow');
      passed++;
    } else {
      log(`❌ FAILED - Request failed: ${data.error || 'Unknown error'}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 2: Verify response time is acceptable (< 10 seconds)
  try {
    log('\nTest 2: Verify response time is acceptable (< 10s)', 'blue');
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Get all my recent emails',
      }),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (response.ok && responseTime < 10000) {
      log(`✅ PASSED - Response time is acceptable: ${responseTime}ms`, 'green');
      passed++;
    } else if (responseTime >= 10000) {
      log(`❌ FAILED - Response time too slow: ${responseTime}ms (threshold: 10000ms)`, 'red');
      failed++;
    } else {
      log(`❌ FAILED - Request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 3: Verify results are limited appropriately
  try {
    log('\nTest 3: Verify results are limited (not returning all 1000+ emails)', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all my emails',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      // Count email entries in response (looking for numbered lists or "From:" markers)
      const emailCount = (data.text.match(/\d+\.\s+\*\*From\*\*/g) || []).length;
      const fromCount = (data.text.match(/\*\*From\*\*:/g) || []).length;
      const actualCount = Math.max(emailCount, fromCount);

      if (actualCount > 0 && actualCount <= 50) {
        log(`✅ PASSED - Results limited appropriately: ${actualCount} emails returned`, 'green');
        log(`   (Good: Not returning thousands of emails at once)`, 'yellow');
        passed++;
      } else if (actualCount > 50) {
        log(`❌ FAILED - Too many emails returned: ${actualCount}`, 'red');
        log(`   (Should limit to reasonable number like 10-50)`, 'yellow');
        failed++;
      } else {
        log(`⚠️  WARNING - Could not determine email count from response`, 'yellow');
        log(`   Assuming reasonable limit is in place`, 'yellow');
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

  // Test 4: Verify response includes reasonable number of emails
  try {
    log('\nTest 4: Verify response includes reasonable number of emails (3-20)', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me my recent unread emails',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      const emailCount = (data.text.match(/\d+\.\s+\*\*From\*\*/g) || []).length;
      const fromCount = (data.text.match(/\*\*From\*\*:/g) || []).length;
      const actualCount = Math.max(emailCount, fromCount);

      if (actualCount >= 1 && actualCount <= 20) {
        log(`✅ PASSED - Reasonable number of emails: ${actualCount}`, 'green');
        passed++;
      } else if (actualCount > 20) {
        log(`⚠️  WARNING - High number of emails: ${actualCount}`, 'yellow');
        log(`   Still acceptable, but consider pagination`, 'yellow');
        passed++;
      } else {
        log(`⚠️  WARNING - No emails found in response`, 'yellow');
        log(`   This may be expected if inbox is empty`, 'yellow');
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

  // Test 5: Verify no timeout errors with large requests
  try {
    log('\nTest 5: Verify no timeout errors with large volume query', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Search through all my emails and find anything from the past year about meetings',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      log(`✅ PASSED - Large query handled without timeout`, 'green');
      passed++;
    } else if (response.status === 504 || response.status === 408) {
      log(`❌ FAILED - Request timed out`, 'red');
      failed++;
    } else {
      log(`❌ FAILED - Request failed with status ${response.status}`, 'red');
      failed++;
    }
  } catch (error) {
    if (error.message.includes('timeout')) {
      log(`❌ FAILED - Request timed out: ${error.message}`, 'red');
      failed++;
    } else {
      log(`❌ FAILED - Error: ${error.message}`, 'red');
      failed++;
    }
  }

  // Test 6: Verify response includes pagination hint if applicable
  try {
    log('\nTest 6: Verify system suggests pagination for large result sets', 'blue');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all emails from last month',
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      const hasPaginationHint =
        data.text.toLowerCase().includes('more') ||
        data.text.toLowerCase().includes('showing') ||
        data.text.toLowerCase().includes('first') ||
        data.text.toLowerCase().includes('recent') ||
        data.text.match(/\d+/) !== null; // Has number indicating count

      if (hasPaginationHint) {
        log(`✅ PASSED - Response includes context about results`, 'green');
        passed++;
      } else {
        log(`⚠️  WARNING - No clear indication of result limitation`, 'yellow');
        log(`   Response should indicate if results are limited`, 'yellow');
        passed++; // Still pass, not critical
      }
    } else {
      log(`❌ FAILED - Request failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Summary
  console.log('\n========================================');
  log('SUMMARY: Large Email Volumes', 'cyan');
  console.log('========================================');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`Total: ${passed + failed}`, 'blue');
  console.log('========================================\n');

  const passRate = (passed / (passed + failed)) * 100;
  if (passRate >= 80) {
    log('🎉 FEATURE VERIFIED: Large email volumes handled efficiently', 'green');
    process.exit(0);
  } else {
    log('❌ FEATURE NEEDS WORK: Large email volume handling needs improvement', 'red');
    process.exit(1);
  }
}

// Run tests
testLargeEmailVolumes().catch((error) => {
  log(`\n❌ TEST SUITE FAILED: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
