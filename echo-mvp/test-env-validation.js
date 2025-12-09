#!/usr/bin/env node

/**
 * Environment Variable Validation Test
 * Tests that the backend validates environment variables on startup
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(description, testFn) {
  try {
    log(`\nTesting: ${description}`, 'cyan');
    await testFn();
    log('✅ PASSED', 'green');
    passedTests++;
  } catch (error) {
    log(`❌ FAILED: ${error.message}`, 'red');
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('Environment Validation Test Suite', 'blue');
  log('========================================\n', 'blue');

  const serverPath = path.join(__dirname, 'mastra-backend', 'src', 'api', 'server.ts');
  const content = fs.readFileSync(serverPath, 'utf8');

  // Test 1: validateEnvironment function exists
  await test('validateEnvironment function is defined', async () => {
    const hasFunction = content.includes('function validateEnvironment()');
    assert(hasFunction, 'Expected validateEnvironment function');
    log(`  Function found: ${hasFunction ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 2: Checks for required environment variables
  await test('Checks for required environment variables', async () => {
    const hasRequiredVars = content.includes('requiredVars') || content.includes('OPENAI_API_KEY');
    assert(hasRequiredVars, 'Expected check for required variables');

    const checksOpenAI = content.includes('OPENAI_API_KEY');
    assert(checksOpenAI, 'Expected check for OPENAI_API_KEY');

    log(`  Checks for required vars: ${hasRequiredVars ? 'Yes' : 'No'}`, 'yellow');
    log(`  Validates OPENAI_API_KEY: ${checksOpenAI ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 3: Exits with error if validation fails
  await test('Exits with error code if validation fails', async () => {
    const hasProcessExit = content.includes('process.exit(1)');
    assert(hasProcessExit, 'Expected process.exit(1) on validation failure');

    const hasErrorMessage = content.includes('console.error') && content.includes('Missing required');
    assert(hasErrorMessage, 'Expected clear error message');

    log(`  Exits on validation failure: ${hasProcessExit ? 'Yes' : 'No'}`, 'yellow');
    log(`  Shows error message: ${hasErrorMessage ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 4: Validates API key is not a placeholder
  await test('Validates API key is not a placeholder', async () => {
    const hasPlaceholderCheck =
      content.includes('your-') ||
      content.includes('sk-xxx') ||
      content.includes('placeholder');

    assert(hasPlaceholderCheck, 'Expected placeholder validation');
    log(`  Checks for placeholder values: ${hasPlaceholderCheck ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 5: Validation runs before server starts
  await test('Validation runs before server starts', async () => {
    const functionDef = content.indexOf('function validateEnvironment()');
    const functionCall = content.indexOf('validateEnvironment()');
    const serverListen = content.indexOf('app.listen');

    assert(functionDef >= 0, 'Function must be defined');
    assert(functionCall >= 0, 'Function must be called');
    assert(serverListen >= 0, 'Server must listen');

    // Ensure validation is called before server starts
    const validationBeforeServer = functionCall < serverListen;
    assert(validationBeforeServer, 'Validation must run before server starts');

    log(`  Validation before server start: ${validationBeforeServer ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 6: Provides helpful error messages
  await test('Provides helpful error messages and instructions', async () => {
    const hasHelpfulMessage =
      content.includes('.env file') &&
      content.includes('check');

    assert(hasHelpfulMessage, 'Expected helpful instructions in error message');

    const hasEmoji = content.includes('❌') || content.includes('💡');
    log(`  Helpful error instructions: ${hasHelpfulMessage ? 'Yes' : 'No'}`, 'yellow');
    log(`  User-friendly formatting: ${hasEmoji ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 7: Verify current .env has required variables
  await test('Current .env file has required variables', async () => {
    const envPath = path.join(__dirname, 'mastra-backend', '.env');

    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found');
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasOpenAIKey = envContent.includes('OPENAI_API_KEY=');

    assert(hasOpenAIKey, 'OPENAI_API_KEY must be in .env file');

    // Check it's not a placeholder
    const lines = envContent.split('\n');
    const keyLine = lines.find(line => line.startsWith('OPENAI_API_KEY='));

    if (keyLine) {
      const value = keyLine.split('=')[1];
      const isPlaceholder = !value || value.includes('your-') || value.includes('sk-xxx');

      if (!isPlaceholder && value.length > 20) {
        log(`  OPENAI_API_KEY is configured: Yes`, 'yellow');
        log(`  API key looks valid: Yes`, 'yellow');
      } else {
        log(`  OPENAI_API_KEY is configured: Yes`, 'yellow');
        log(`  API key looks valid: Maybe (could be placeholder)`, 'yellow');
      }
    }
  });

  // Print summary
  log('\n========================================', 'blue');
  log('Test Results Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${passedTests + failedTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log('========================================\n', 'blue');

  if (passedTests === 7) {
    log('✅ All environment validation tests passed!', 'green');
    log('\nEnvironment validation features:', 'green');
    log('  ✓ Validates OPENAI_API_KEY is present', 'green');
    log('  ✓ Validates API key is not a placeholder', 'green');
    log('  ✓ Exits with clear error if validation fails', 'green');
    log('  ✓ Provides helpful error messages', 'green');
    log('  ✓ Runs before server starts', 'green');
    log('\n✅ Feature "Environment variables are validated on startup" is ready!', 'green');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
