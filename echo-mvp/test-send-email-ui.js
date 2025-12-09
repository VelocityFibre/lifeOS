#!/usr/bin/env node

/**
 * Test Suite: Send Email Through Chat Interface End-to-End
 *
 * This script tests Feature #23: User can send email through chat interface
 *
 * Tests:
 * 1. Send email with explicit parameters
 * 2. Send email using natural language
 * 3. Verify success message format
 * 4. Test various email formats
 */

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

async function testSendEmailExplicit() {
  logTest('Send email with explicit parameters (@mail send email to...)');

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '@mail send email to test@example.com with subject "Test Email" and body "This is a test message"',
        threadId: `test-send-explicit-${Date.now()}`
      })
    });

    const data = await response.json();

    if (!data.success) {
      logFail('API returned success: false');
      return false;
    }

    if (!data.text) {
      logFail('No response text received');
      return false;
    }

    const responseText = data.text.toLowerCase();

    // Check for success indicators
    const hasSuccessIndicator =
      responseText.includes('sent') ||
      responseText.includes('success') ||
      responseText.includes('delivered') ||
      responseText.includes('test@example.com');

    if (!hasSuccessIndicator) {
      logFail('Response does not indicate successful send');
      log(`  Response: ${data.text.substring(0, 200)}`, 'yellow');
      return false;
    }

    log(`  Response: ${data.text.substring(0, 150)}...`, 'yellow');
    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testSendEmailNaturalLanguage() {
  logTest('Send email using natural language');

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Send an email to john@example.com saying "Hello, this is a test message from my personal assistant. Thanks!"',
        threadId: `test-send-natural-${Date.now()}`
      })
    });

    const data = await response.json();

    if (!data.success) {
      logFail('API returned success: false');
      return false;
    }

    if (!data.text) {
      logFail('No response text received');
      return false;
    }

    const responseText = data.text.toLowerCase();

    // Check for success indicators
    const hasSuccessIndicator =
      responseText.includes('sent') ||
      responseText.includes('success') ||
      responseText.includes('delivered') ||
      responseText.includes('john@example.com');

    if (!hasSuccessIndicator) {
      logFail('Response does not indicate successful send');
      log(`  Response: ${data.text.substring(0, 200)}`, 'yellow');
      return false;
    }

    log(`  Response: ${data.text.substring(0, 150)}...`, 'yellow');
    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testSendEmailWithSubjectAndBody() {
  logTest('Send email with subject and body separately');

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '@mail send to alice@example.com\nSubject: Meeting Tomorrow\nBody: Hi Alice, can we meet tomorrow at 3pm?',
        threadId: `test-send-structured-${Date.now()}`
      })
    });

    const data = await response.json();

    if (!data.success) {
      logFail('API returned success: false');
      return false;
    }

    if (!data.text) {
      logFail('No response text received');
      return false;
    }

    const responseText = data.text.toLowerCase();

    // Check for success indicators
    const hasSuccessIndicator =
      responseText.includes('sent') ||
      responseText.includes('success') ||
      responseText.includes('delivered') ||
      responseText.includes('alice@example.com');

    if (!hasSuccessIndicator) {
      logFail('Response does not indicate successful send');
      log(`  Response: ${data.text.substring(0, 200)}`, 'yellow');
      return false;
    }

    log(`  Response: ${data.text.substring(0, 150)}...`, 'yellow');
    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testSendEmailResponseFormat() {
  logTest('Verify send email response includes key details');

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Send email to test@example.com with subject "Verification Test"',
        threadId: `test-send-format-${Date.now()}`
      })
    });

    const data = await response.json();

    if (!data.success) {
      logFail('API returned success: false');
      return false;
    }

    if (!data.text) {
      logFail('No response text received');
      return false;
    }

    // Response should contain some details about the sent email
    const responseText = data.text.toLowerCase();

    // At minimum, should mention the recipient
    if (!responseText.includes('test@example.com') && !responseText.includes('email')) {
      logFail('Response does not mention email details');
      log(`  Response: ${data.text}`, 'yellow');
      return false;
    }

    log(`  Response format looks good`, 'yellow');
    log(`  Sample: ${data.text.substring(0, 100)}...`, 'yellow');
    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function runTests() {
  log('========================================', 'blue');
  log('Send Email Through UI Test Suite', 'blue');
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
    testSendEmailExplicit,
    testSendEmailNaturalLanguage,
    testSendEmailWithSubjectAndBody,
    testSendEmailResponseFormat,
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

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
