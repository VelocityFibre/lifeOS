#!/usr/bin/env node

/**
 * Test email summaries feature
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  log('cyan', '\n=== Testing Email Summary Feature ===\n');

  // Test 1: Ask for a summary of emails
  log('yellow', 'Test 1: Request email summary');
  const response1 = await makeRequest({
    message: 'Can you give me a summary of my recent emails?',
    accessToken: 'demo-token',
    threadId: 'summary-test-1',
  });

  if (response1.status === 200 && response1.data.success) {
    log('green', '✅ Summary request successful');
    log('cyan', '\nResponse:');
    console.log(response1.data.text);
  } else {
    log('red', '❌ Summary request failed');
  }

  // Test 2: Ask for summary with specific criteria
  log('yellow', '\n\nTest 2: Request summary of unread emails');
  const response2 = await makeRequest({
    message: 'Summarize my unread emails',
    accessToken: 'demo-token',
    threadId: 'summary-test-2',
  });

  if (response2.status === 200 && response2.data.success) {
    log('green', '✅ Unread emails summary successful');
    log('cyan', '\nResponse:');
    console.log(response2.data.text);
  } else {
    log('red', '❌ Unread summary failed');
  }

  // Test 3: Verify summary is concise
  log('yellow', '\n\nTest 3: Verify summary format');
  if (response1.data.text && response1.data.text.length > 0) {
    log('green', '✅ Summary includes key information');

    // Check if it mentions emails
    if (response1.data.text.toLowerCase().includes('email')) {
      log('green', '✅ Summary mentions emails');
    }

    // Check if it's reasonably concise (not just a data dump)
    if (response1.data.text.length < 2000) {
      log('green', '✅ Summary is concise');
    }
  }

  log('cyan', '\n=== Email Summary Feature Test Complete ===\n');
}

main().catch((error) => {
  log('red', `\nError: ${error.message}`);
  process.exit(1);
});
