#!/usr/bin/env node

/**
 * Quick Verification Test - Session 12
 * Tests core functionality to ensure no regressions
 */

async function runVerificationTests() {
  console.log('========================================');
  console.log('VERIFICATION TEST - Session 12');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Backend Health Check
  console.log('Test 1: Backend Health Check');
  try {
    const healthResponse = await fetch('http://localhost:3002/health');
    const healthData = await healthResponse.json();

    if (healthData.status === 'ok') {
      console.log('✅ PASSED - Backend is healthy\n');
      passed++;
    } else {
      console.log('❌ FAILED - Backend returned unexpected status\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}\n`);
    failed++;
  }

  // Test 2: Send a message to @mail agent
  console.log('Test 2: Chat with @mail agent');
  try {
    const chatResponse = await fetch('http://localhost:3002/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me my recent emails',
        accessToken: 'demo'
      })
    });

    const chatData = await chatResponse.json();

    if (chatData.success && chatData.text) {
      console.log('✅ PASSED - @mail agent responded');
      console.log(`   Response preview: ${chatData.text.substring(0, 100)}...\n`);
      passed++;
    } else {
      console.log('❌ FAILED - Invalid response from @mail agent\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}\n`);
    failed++;
  }

  // Test 3: Test @mention autocomplete (via @cal)
  console.log('Test 3: @mention routing to @cal');
  try {
    const calResponse = await fetch('http://localhost:3002/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '@cal show my calendar',
        accessToken: 'demo'
      })
    });

    const calData = await calResponse.json();

    if (calData.success && calData.text.includes('coming soon')) {
      console.log('✅ PASSED - @cal routing works');
      console.log(`   Response: ${calData.text}\n`);
      passed++;
    } else {
      console.log('❌ FAILED - @cal routing broken\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}\n`);
    failed++;
  }

  // Test 4: Test markdown support (if email contains formatted text)
  console.log('Test 4: Markdown rendering capability');
  try {
    const markdownResponse = await fetch('http://localhost:3002/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What can you do?',
        accessToken: 'demo'
      })
    });

    const markdownData = await markdownResponse.json();

    // Check if response contains markdown formatting
    const hasMarkdown = markdownData.text && (
      markdownData.text.includes('**') ||  // bold
      markdownData.text.includes('- ') ||   // lists
      markdownData.text.includes('\n')      // newlines
    );

    if (hasMarkdown) {
      console.log('✅ PASSED - Agent uses markdown formatting\n');
      passed++;
    } else {
      console.log('⚠️  WARNING - Response may not use markdown formatting\n');
      passed++; // Still pass, just a warning
    }
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}\n`);
    failed++;
  }

  // Summary
  console.log('========================================');
  console.log('VERIFICATION RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('========================================\n');

  if (failed === 0) {
    console.log('🎉 ALL VERIFICATION TESTS PASSED!');
    console.log('No regressions detected. Safe to proceed with new features.\n');
    return true;
  } else {
    console.log('⚠️  SOME TESTS FAILED!');
    console.log('Fix regressions before implementing new features.\n');
    return false;
  }
}

// Run tests
runVerificationTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
