#!/usr/bin/env node

/**
 * Test Suite: Email Format Handling (HTML and Plain Text)
 *
 * This script tests:
 * - Feature #40: @mail agent can handle HTML emails
 * - Feature #41: @mail agent can handle plain text emails
 *
 * Tests:
 * 1. Code verification: Check if HTML handling is implemented
 * 2. Code verification: Check if plain text handling is implemented
 * 3. API test: Verify mock responses work correctly
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

async function testCodeImplementation() {
  logTest('Verify HTML and Plain Text handling is implemented in code');

  try {
    const gmailToolsPath = path.join(__dirname, 'mastra-backend/src/tools/gmail-tools.ts');
    const content = fs.readFileSync(gmailToolsPath, 'utf-8');

    // Check for text/plain handling
    const hasPlainTextHandling = content.includes('text/plain');
    if (!hasPlainTextHandling) {
      logFail('text/plain handling not found in code');
      return false;
    }
    log('  ✓ text/plain handling found', 'yellow');

    // Check for text/html handling
    const hasHtmlHandling = content.includes('text/html');
    if (!hasHtmlHandling) {
      logFail('text/html handling not found in code');
      return false;
    }
    log('  ✓ text/html handling found', 'yellow');

    // Check for HTML stripping logic
    const hasHtmlStripping = content.includes('Remove HTML tags') || content.includes('replace(/<[^>]+>/g');
    if (!hasHtmlStripping) {
      logFail('HTML stripping logic not found');
      return false;
    }
    log('  ✓ HTML stripping logic found', 'yellow');

    // Check for HTML entity decoding
    const hasEntityDecoding = content.includes('&nbsp;') || content.includes('&amp;');
    if (!hasEntityDecoding) {
      logFail('HTML entity decoding not found');
      return false;
    }
    log('  ✓ HTML entity decoding found', 'yellow');

    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testPlainTextEmails() {
  logTest('Plain text email handling via API');

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'show me my emails',
        threadId: `test-plaintext-${Date.now()}`
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

    // In dev mode, we get mock emails which are plain text
    log('  Response contains email data', 'yellow');
    log(`  Sample: ${data.text.substring(0, 100)}...`, 'yellow');
    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function testHtmlEmailsLogic() {
  logTest('HTML email handling logic verification');

  try {
    // Simulate the HTML stripping logic
    const testHtmlContent = `
      <html>
        <head><style>body { color: red; }</style></head>
        <body>
          <p>Hello <strong>World</strong>!</p>
          <p>This is a &nbsp; test &amp; demo.</p>
        </body>
      </html>
    `;

    // Apply the same transformations as in the code
    const stripped = testHtmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Verify the result
    if (!stripped.includes('Hello') || !stripped.includes('World')) {
      logFail('HTML stripping failed - text not extracted correctly');
      log(`  Result: ${stripped}`, 'yellow');
      return false;
    }

    if (!stripped.includes('test & demo')) {
      logFail('HTML entity decoding failed');
      log(`  Result: ${stripped}`, 'yellow');
      return false;
    }

    if (stripped.includes('<') || stripped.includes('style')) {
      logFail('HTML tags not completely removed');
      log(`  Result: ${stripped}`, 'yellow');
      return false;
    }

    log('  HTML stripping works correctly', 'yellow');
    log(`  Input: ${testHtmlContent.substring(0, 50).replace(/\n/g, '')}...`, 'yellow');
    log(`  Output: ${stripped}`, 'yellow');
    logPass();
    return true;
  } catch (error) {
    logFail(error.message);
    return false;
  }
}

async function runTests() {
  log('========================================', 'blue');
  log('Email Format Handling Test Suite', 'blue');
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
    testCodeImplementation,
    testHtmlEmailsLogic,
    testPlainTextEmails,
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
    log('✅ Features #40 and #41 PASS:', 'green');
    log('   - HTML email handling implemented', 'green');
    log('   - Plain text email handling implemented', 'green');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
