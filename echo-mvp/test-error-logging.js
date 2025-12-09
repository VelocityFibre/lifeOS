#!/usr/bin/env node

/**
 * Test Suite: Backend Error Logging
 *
 * This script tests Feature #37: Backend logs errors appropriately
 *
 * Tests:
 * 1. Code verification: Check if error logging exists
 * 2. Trigger error and verify response format
 * 3. Verify sensitive data is not exposed
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3002';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\nTesting: ${name}`, 'cyan');
}

function logPass() {
  log('✅ PASSED', 'green');
}

function logFail(reason) {
  log(`❌ FAILED: ${reason}`, 'red');
}

async function testErrorLoggingCode() {
  logTest('Verify error logging is implemented in code');

  try {
    const serverPath = path.join(__dirname, 'mastra-backend/src/api/server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');

    // Check for console.error in error handler
    const hasConsoleError = content.includes('console.error');
    if (!hasConsoleError) {
      logFail('console.error not found in code');
      return false;
    }
    log('  ✓ console.error found', 'yellow');

    // Check for try-catch block
    const hasTryCatch = content.includes('try {') && content.includes('catch');
    if (!hasTryCatch) {
      logFail('try-catch error handling not found');
      return false;
    }
    log('  ✓ try-catch error handling found', 'yellow');

    // Check for error response
    const hasErrorResponse = content.includes('error:') && content.includes('error.message');
    if (!hasErrorResponse) {
      logFail('error response handling not found');
      return false;
    }
    log('  ✓ error response handling found', 'yellow');

    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testErrorResponse() {
  logTest('Trigger error and verify appropriate response');

  try {
    // Send invalid request to trigger error handling
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required "message" field
        threadId: `test-error-${Date.now()}`
      })
    });

    if (response.status !== 400) {
      logFail(`Expected 400 status, got ${response.status}`);
      return false;
    }
    log('  ✓ Returns 400 status for invalid request', 'yellow');

    const data = await response.json();

    if (!data.error) {
      logFail('Error response does not contain error field');
      return false;
    }
    log('  ✓ Error response contains error field', 'yellow');

    if (data.error !== 'Message is required') {
      logFail(`Unexpected error message: ${data.error}`);
      return false;
    }
    log(`  ✓ Error message is clear: "${data.error}"`, 'yellow');

    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testSensitiveDataNotLogged() {
  logTest('Verify sensitive data is not exposed in errors');

  try {
    // The error logging should log to console but not expose internal details to user
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'test',
        accessToken: 'secret-token-12345', // Simulated sensitive data
        threadId: `test-sensitive-${Date.now()}`
      })
    });

    const data = await response.json();

    // Even if there's an error, the response should not contain the access token
    const responseStr = JSON.stringify(data);

    if (responseStr.includes('secret-token-12345')) {
      logFail('Sensitive data (access token) exposed in response');
      return false;
    }
    log('  ✓ Access token not exposed in response', 'yellow');

    // Check that we don't leak stack traces
    if (responseStr.includes('at ') && responseStr.includes('.ts:')) {
      logFail('Stack trace leaked in response');
      return false;
    }
    log('  ✓ No stack traces in response', 'yellow');

    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function runTests() {
  log('========================================', 'blue');
  log('Backend Error Logging Test Suite', 'blue');
  log('========================================\n', 'blue');

  // Check backend is available
  try {
    const healthCheck = await fetch(`${API_BASE}/health`);
    const health = await healthCheck.json();
    log(`Backend Status: ${health.status}`, 'yellow');
  } catch (error) {
    log('❌ Backend is not running!', 'red');
    process.exit(1);
  }

  const tests = [
    testErrorLoggingCode,
    testErrorResponse,
    testSensitiveDataNotLogged,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  log('\n========================================', 'blue');
  log('Test Results Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${tests.length}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('========================================\n', 'blue');

  if (failed === 0) {
    log('✅ Feature #37 PASSES: Backend logs errors appropriately', 'green');
    log('   - Error logging implemented', 'green');
    log('   - User-friendly error responses', 'green');
    log('   - Sensitive data not exposed', 'green');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
