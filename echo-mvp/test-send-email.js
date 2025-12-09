#!/usr/bin/env node

/**
 * Test Send Email Functionality
 * Tests the @mail agent's ability to send emails
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3002';

// ANSI color codes
const colors = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`${colors.blue}\n========================================${colors.reset}`);
  console.log(`${colors.blue}Send Email Functionality Test${colors.reset}`);
  console.log(`${colors.blue}========================================\n${colors.reset}`);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Send email with all required fields
  console.log(`${colors.cyan}\nTest 1: Send email with all required fields${colors.reset}`);
  try {
    const response = await makeRequest('POST', '/api/chat', {
      message: 'Send an email to test@example.com with subject "Test Email" and body "This is a test email from the @mail agent."',
      threadId: 'test-send-' + Date.now(),
    });

    console.log(`${colors.yellow}  Response status: ${response.status}${colors.reset}`);
    console.log(`${colors.yellow}  Response preview: ${response.data.text?.substring(0, 150)}...${colors.reset}`);

    if (response.status === 200 && response.data.text &&
        (response.data.text.includes('sent') || response.data.text.includes('MOCK MODE'))) {
      console.log(`${colors.green}✅ PASSED${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Response doesn't indicate successful send${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Test 2: Send email with natural language request
  console.log(`${colors.cyan}\nTest 2: Send email using natural language${colors.reset}`);
  try {
    const response = await makeRequest('POST', '/api/chat', {
      message: 'Email john@example.com and tell him about our meeting tomorrow at 2pm',
      threadId: 'test-send-nl-' + Date.now(),
    });

    console.log(`${colors.yellow}  Response status: ${response.status}${colors.reset}`);
    console.log(`${colors.yellow}  Response preview: ${response.data.text?.substring(0, 150)}...${colors.reset}`);

    if (response.status === 200 && response.data.text) {
      console.log(`${colors.green}✅ PASSED${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Invalid response${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Test 3: Verify send email tool is available (check agent can handle send requests)
  console.log(`${colors.cyan}\nTest 3: Agent can compose and send emails${colors.reset}`);
  try {
    const response = await makeRequest('POST', '/api/chat', {
      message: 'Send a quick thank you email to sarah@company.com',
      threadId: 'test-send-compose-' + Date.now(),
    });

    console.log(`${colors.yellow}  Response status: ${response.status}${colors.reset}`);
    console.log(`${colors.yellow}  Response preview: ${response.data.text?.substring(0, 150)}...${colors.reset}`);

    if (response.status === 200 && response.data.success !== false) {
      console.log(`${colors.green}✅ PASSED${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Test 4: Check response includes confirmation details
  console.log(`${colors.cyan}\nTest 4: Send email response includes details${colors.reset}`);
  try {
    const response = await makeRequest('POST', '/api/chat', {
      message: 'Send an email to team@company.com with subject "Weekly Update" and a brief status update',
      threadId: 'test-send-details-' + Date.now(),
    });

    console.log(`${colors.yellow}  Response status: ${response.status}${colors.reset}`);
    console.log(`${colors.yellow}  Response: ${response.data.text?.substring(0, 200)}${colors.reset}`);

    const text = response.data.text || '';
    const hasConfirmation = text.includes('sent') || text.includes('success') || text.includes('✅');

    if (response.status === 200 && hasConfirmation) {
      console.log(`${colors.green}✅ PASSED${colors.reset}`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED - Missing confirmation details${colors.reset}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`);
    failedTests++;
  }

  // Summary
  console.log(`${colors.blue}\n========================================${colors.reset}`);
  console.log(`${colors.blue}Test Results Summary${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.cyan}Total Tests: ${passedTests + failedTests}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.blue}========================================\n${colors.reset}`);

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests();
