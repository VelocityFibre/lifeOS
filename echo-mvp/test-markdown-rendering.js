#!/usr/bin/env node

/**
 * Markdown Rendering Test
 * Tests that markdown formatting is properly rendered in agent responses
 */

const http = require('http');

const BASE_URL = 'localhost';
const BACKEND_PORT = 3002;

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

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: BACKEND_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
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
  log('Markdown Rendering Test Suite', 'blue');
  log('========================================\n', 'blue');

  // Test 1: Backend returns markdown formatted response
  await test('Backend returns markdown with bold text (**)', async () => {
    const response = await makeRequest('/api/chat', 'POST', {
      message: 'Show me my unread emails'
    });
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    assert(response.body.text, 'Expected text in response');

    // Check for bold markdown syntax
    const hasBold = response.body.text.includes('**');
    assert(hasBold, 'Expected response to contain bold markdown (**text**)');
    log(`  Response contains bold markdown: ${hasBold ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 2: Backend returns list formatting
  await test('Backend returns markdown with lists (-)', async () => {
    const response = await makeRequest('/api/chat', 'POST', {
      message: 'What can you help me with?'
    });
    assert(response.statusCode === 200, `Expected status 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');

    // Check for list markdown syntax (either - or numbered lists)
    const hasList = response.body.text.includes('-') || /\d+\./.test(response.body.text);
    assert(hasList, 'Expected response to contain list markdown');
    log(`  Response contains list markdown: ${hasList ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 3: Verify markdown package is installed in frontend
  await test('Frontend package.json includes markdown package', async () => {
    const fs = require('fs');
    const path = require('path');
    const packagePath = path.join(__dirname, 'expo-app', 'package.json');

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const hasMarkdownPackage = packageJson.dependencies &&
                               packageJson.dependencies['react-native-markdown-display'];

    assert(hasMarkdownPackage, 'Expected react-native-markdown-display in dependencies');
    log(`  Markdown package version: ${packageJson.dependencies['react-native-markdown-display']}`, 'yellow');
  });

  // Test 4: Verify EmailChat.tsx imports Markdown component
  await test('EmailChat.tsx imports Markdown component', async () => {
    const fs = require('fs');
    const path = require('path');
    const chatPath = path.join(__dirname, 'expo-app', 'src', 'screens', 'EmailChat.tsx');

    const content = fs.readFileSync(chatPath, 'utf8');
    const hasImport = content.includes('react-native-markdown-display');

    assert(hasImport, 'Expected import from react-native-markdown-display');
    log(`  Markdown import found: ${hasImport ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 5: Verify custom renderMessageText function exists
  await test('EmailChat.tsx has custom renderMessageText function', async () => {
    const fs = require('fs');
    const path = require('path');
    const chatPath = path.join(__dirname, 'expo-app', 'src', 'screens', 'EmailChat.tsx');

    const content = fs.readFileSync(chatPath, 'utf8');
    const hasRenderer = content.includes('renderMessageText');
    const hasMarkdownComponent = content.includes('<Markdown');

    assert(hasRenderer, 'Expected renderMessageText function');
    assert(hasMarkdownComponent, 'Expected Markdown component usage');
    log(`  renderMessageText function: ${hasRenderer ? 'Yes' : 'No'}`, 'yellow');
    log(`  Markdown component: ${hasMarkdownComponent ? 'Yes' : 'No'}`, 'yellow');
  });

  // Test 6: Verify markdown styles are defined
  await test('EmailChat.tsx defines markdown styles', async () => {
    const fs = require('fs');
    const path = require('path');
    const chatPath = path.join(__dirname, 'expo-app', 'src', 'screens', 'EmailChat.tsx');

    const content = fs.readFileSync(chatPath, 'utf8');
    const hasStyles = content.includes('markdownStyles');
    const hasStrongStyle = content.includes('strong:');
    const hasEmStyle = content.includes('em:');
    const hasListStyle = content.includes('list_item:') || content.includes('bullet_list:');

    assert(hasStyles, 'Expected markdownStyles definition');
    assert(hasStrongStyle, 'Expected strong (bold) style');
    assert(hasEmStyle, 'Expected em (italic) style');
    assert(hasListStyle, 'Expected list styles');

    log(`  Markdown styles defined: ${hasStyles ? 'Yes' : 'No'}`, 'yellow');
    log(`  Bold style: ${hasStrongStyle ? 'Yes' : 'No'}`, 'yellow');
    log(`  Italic style: ${hasEmStyle ? 'Yes' : 'No'}`, 'yellow');
    log(`  List style: ${hasListStyle ? 'Yes' : 'No'}`, 'yellow');
  });

  // Print summary
  log('\n========================================', 'blue');
  log('Test Results Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${passedTests + failedTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log('========================================\n', 'blue');

  if (passedTests === 6) {
    log('✅ All markdown rendering tests passed!', 'green');
    log('The feature is ready to be marked as passing in feature_list.json', 'green');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
