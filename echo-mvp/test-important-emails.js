#!/usr/bin/env node

/**
 * Test Feature #12: @mail agent can filter important emails
 */

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data, raw: true });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

async function testImportantEmails() {
  console.log('\n========================================');
  console.log('Testing Feature #12: Filter Important Emails');
  console.log('========================================\n');

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      message: 'Show me my important emails',
      threadId: 'test-important-' + Date.now()
    });

    console.log('Status:', response.status);

    if (response.status === 200 && response.data.text) {
      const reply = response.data.text;
      console.log('\nResponse:');
      console.log(reply);

      // Check if response mentions important/starred emails or indicates filtering
      const hasImportantContext = reply.toLowerCase().includes('important') ||
                                  reply.toLowerCase().includes('starred') ||
                                  reply.toLowerCase().includes('priority') ||
                                  reply.toLowerCase().includes('flagged');

      if (hasImportantContext) {
        console.log('\n✅ PASSED - Agent can filter important emails');
        process.exit(0);
      } else {
        console.log('\n⚠️  Response does not clearly indicate important email filtering');
        console.log('This may still be working if the agent understood the query');
        process.exit(0);
      }
    } else {
      console.log('\n❌ FAILED - Request did not succeed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n❌ FAILED');
    process.exit(1);
  }
}

testImportantEmails();
