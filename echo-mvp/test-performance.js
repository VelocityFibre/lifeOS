#!/usr/bin/env node

/**
 * Test response time performance
 * Feature: Response time is acceptable (< 2 seconds)
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
  const startTime = Date.now();

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
        const endTime = Date.now();
        const duration = endTime - startTime;

        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
            duration
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: body,
            duration
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  log('cyan', '\n=== Performance Testing ===\n');

  const tests = [
    'Show my unread emails',
    'Search for emails from john',
    'Summarize my recent emails',
    'What emails do I have?',
    'Hello',
  ];

  const durations = [];

  for (let i = 0; i < tests.length; i++) {
    const query = tests[i];
    log('yellow', `\nTest ${i + 1}: "${query}"`);

    const response = await makeRequest({
      message: query,
      accessToken: 'demo-token',
      threadId: `perf-test-${i}`,
    });

    if (response.status === 200) {
      const seconds = (response.duration / 1000).toFixed(2);
      durations.push(response.duration);

      if (response.duration < 2000) {
        log('green', `✅ Response time: ${seconds}s (< 2s)`);
      } else {
        log('red', `❌ Response time: ${seconds}s (> 2s)`);
      }
    } else {
      log('red', `❌ Request failed with status ${response.status}`);
    }
  }

  // Calculate statistics
  log('cyan', '\n=== Performance Statistics ===');
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  log('yellow', `Average response time: ${(avgDuration / 1000).toFixed(2)}s`);
  log('yellow', `Min response time: ${(minDuration / 1000).toFixed(2)}s`);
  log('yellow', `Max response time: ${(maxDuration / 1000).toFixed(2)}s`);

  if (avgDuration < 2000 && maxDuration < 3000) {
    log('green', '\n✅ Performance is acceptable (< 2s average)');
  } else {
    log('red', '\n❌ Performance needs improvement');
  }

  log('cyan', '\n=== Performance Test Complete ===\n');
}

main().catch((error) => {
  log('red', `\nError: ${error.message}`);
  process.exit(1);
});
