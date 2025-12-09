#!/usr/bin/env node

/**
 * Test Direct Email Sending via Backend
 * Directly tests if the send email tool is available
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3002';

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

async function testSendEmail() {
  console.log('\n🧪 Testing Send Email Functionality...\n');

  // Test 1: Very explicit send command
  console.log('Test 1: Explicit send email command');
  const response1 = await makeRequest('POST', '/api/chat', {
    message: '@mail please send an email to test@example.com with subject "Test" and say "Hello World"',
    threadId: 'test-explicit-' + Date.now(),
  });
  console.log('Response:', response1.data.text?.substring(0, 300));
  console.log('Success:', response1.data.success);
  console.log('');

  // Test 2: Check if agent mentions send capability
  console.log('Test 2: Ask agent about capabilities');
  const response2 = await makeRequest('POST', '/api/chat', {
    message: 'What can you help me with?',
    threadId: 'test-capabilities-' + Date.now(),
  });
  console.log('Response:', response2.data.text);
  console.log('');

  // Test 3: Try with different phrasing
  console.log('Test 3: Alternative phrasing');
  const response3 = await makeRequest('POST', '/api/chat', {
    message: 'Compose and send a message to bob@test.com saying thanks',
    threadId: 'test-compose-' + Date.now(),
  });
  console.log('Response:', response3.data.text?.substring(0, 300));
  console.log('');
}

testSendEmail().catch(console.error);
