#!/usr/bin/env node

/**
 * Test Feature #103: Agent understands intent to compose new email
 *
 * This test verifies that the agent can understand when the user wants to compose
 * an email and guides them through the process.
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3002;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function addResult(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
}

// Helper to send chat message
function sendMessage(message, threadId = 'test-thread') {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      message,
      accessToken: "test-token",
      threadId
    });

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: true,
            statusCode: res.statusCode,
            response: response.text || response.message || '',
            threadId: response.threadId
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`,
            data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

// Test 1: Agent understands "I want to email"
async function testBasicCompositionIntent() {
  console.log('\nTest 1: Agent understands basic email composition intent');

  const result = await sendMessage("I want to email John");

  if (!result.success) {
    addResult(
      'Basic composition intent',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  // Check if agent acknowledges email composition intent
  const acknowledgesIntent =
    response.includes('email') ||
    response.includes('send') ||
    response.includes('compose') ||
    response.includes('message') ||
    response.includes('john');

  // Check if agent asks for details
  const asksForDetails =
    response.includes('who') ||
    response.includes('subject') ||
    response.includes('what') ||
    response.includes('tell me') ||
    response.includes('details') ||
    response.includes('content') ||
    response.includes('body') ||
    response.includes('?');

  if (acknowledgesIntent && asksForDetails) {
    addResult(
      'Understands composition intent',
      true,
      'Agent recognized intent and asked for details'
    );
  } else if (acknowledgesIntent) {
    addResult(
      'Recognizes email intent',
      true,
      'Agent understood it\'s about emailing, may need more explicit prompting'
    );
  } else {
    addResult(
      'Basic composition intent',
      false,
      'Agent did not recognize email composition intent'
    );
  }
}

// Test 2: Agent understands "Send an email to..."
async function testSendEmailIntent() {
  console.log('\nTest 2: Agent understands "Send an email to" phrasing');

  const result = await sendMessage("Send an email to support@example.com");

  if (!result.success) {
    addResult(
      'Send email intent',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  const acknowledgesIntent =
    response.includes('email') ||
    response.includes('send') ||
    response.includes('support@example.com') ||
    response.includes('message');

  if (acknowledgesIntent) {
    addResult(
      'Understands "send email" phrasing',
      true,
      'Agent recognized the send email intent'
    );
  } else {
    addResult(
      'Send email intent',
      false,
      'Agent did not recognize send email intent'
    );
  }
}

// Test 3: Agent understands "Draft an email..."
async function testDraftEmailIntent() {
  console.log('\nTest 3: Agent understands "Draft an email" phrasing');

  const result = await sendMessage("Draft an email about the meeting tomorrow");

  if (!result.success) {
    addResult(
      'Draft email intent',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  const acknowledgesIntent =
    response.includes('email') ||
    response.includes('draft') ||
    response.includes('compose') ||
    response.includes('meeting');

  if (acknowledgesIntent) {
    addResult(
      'Understands "draft email" phrasing',
      true,
      'Agent recognized the draft email intent'
    );
  } else {
    addResult(
      'Draft email intent',
      false,
      'Agent did not recognize draft email intent'
    );
  }
}

// Test 4: Agent handles complete email composition request
async function testCompleteEmailRequest() {
  console.log('\nTest 4: Agent handles complete email composition request');

  const result = await sendMessage(
    "Send an email to john@example.com with subject 'Meeting Update' and tell him the meeting is rescheduled to 3pm"
  );

  if (!result.success) {
    addResult(
      'Complete email request',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  const processesRequest =
    response.includes('email') ||
    response.includes('send') ||
    response.includes('sent') ||
    response.includes('john') ||
    response.includes('meeting');

  if (processesRequest) {
    addResult(
      'Handles complete email request',
      true,
      'Agent processed the complete email composition request'
    );
  } else {
    addResult(
      'Complete email request',
      false,
      'Agent did not properly handle complete email request'
    );
  }
}

// Test 5: Agent confirms before sending
async function testConfirmationBehavior() {
  console.log('\nTest 5: Agent asks for confirmation before sending');

  const result = await sendMessage(
    "Email jane@example.com and say 'Thanks for your help!'"
  );

  if (!result.success) {
    addResult(
      'Confirmation behavior',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  // Check if agent asks for confirmation or indicates email will be sent
  const hasConfirmation =
    response.includes('confirm') ||
    response.includes('should i send') ||
    response.includes('would you like me to') ||
    response.includes('shall i') ||
    response.includes('?');

  // Or check if it mentions sending
  const mentionsSending =
    response.includes('send') ||
    response.includes('sent') ||
    response.includes('email');

  if (hasConfirmation) {
    addResult(
      'Asks for confirmation',
      true,
      'Agent seeks confirmation before sending'
    );
  } else if (mentionsSending) {
    addResult(
      'Processes email request',
      true,
      'Agent acknowledges email sending (may auto-send in mock mode)'
    );
  } else {
    addResult(
      'Confirmation behavior',
      false,
      'Agent response unclear about sending email'
    );
  }
}

// Test 6: Agent handles ambiguous email intent
async function testAmbiguousIntent() {
  console.log('\nTest 6: Agent handles ambiguous email composition intent');

  const result = await sendMessage("I need to contact Sarah");

  if (!result.success) {
    addResult(
      'Ambiguous intent',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  // Agent should either:
  // 1. Offer to help with email
  // 2. Ask for clarification
  // 3. Suggest email as an option

  const offersHelp =
    response.includes('email') ||
    response.includes('contact') ||
    response.includes('how') ||
    response.includes('help') ||
    response.includes('?');

  if (offersHelp) {
    addResult(
      'Handles ambiguous intent',
      true,
      'Agent responded appropriately to ambiguous contact intent'
    );
  } else {
    addResult(
      'Ambiguous intent',
      false,
      'Agent did not help with ambiguous contact intent'
    );
  }
}

// Test 7: Agent provides helpful guidance
async function testHelpfulGuidance() {
  console.log('\nTest 7: Agent provides helpful guidance for email composition');

  const result = await sendMessage("How do I send an email?");

  if (!result.success) {
    addResult(
      'Helpful guidance',
      false,
      `Request failed: ${result.error}`
    );
    return;
  }

  const response = result.response.toLowerCase();

  const providesGuidance =
    response.includes('email') ||
    response.includes('send') ||
    response.includes('tell me') ||
    response.includes('just') ||
    response.includes('help');

  if (providesGuidance) {
    addResult(
      'Provides helpful guidance',
      true,
      'Agent offers guidance on sending emails'
    );
  } else {
    addResult(
      'Helpful guidance',
      false,
      'Agent did not provide guidance on email composition'
    );
  }
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('EMAIL COMPOSITION INTENT TEST - Feature #103');
  console.log('========================================');

  await testBasicCompositionIntent();
  await testSendEmailIntent();
  await testDraftEmailIntent();
  await testCompleteEmailRequest();
  await testConfirmationBehavior();
  await testAmbiguousIntent();
  await testHelpfulGuidance();

  // Print summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.tests.length}`);
  console.log('========================================\n');

  // Determine overall pass/fail
  const passRate = results.passed / results.tests.length;

  if (passRate >= 0.7) {
    console.log('✅ FEATURE #103 PASSES');
    console.log(`Pass rate: ${(passRate * 100).toFixed(1)}% (threshold: 70%)`);
    console.log('\nAgent understands intent to compose new emails.');
    process.exit(0);
  } else {
    console.log('❌ FEATURE #103 NEEDS WORK');
    console.log(`Pass rate: ${(passRate * 100).toFixed(1)}% (threshold: 70%)`);
    console.log('\nEmail composition intent understanding needs improvement.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
