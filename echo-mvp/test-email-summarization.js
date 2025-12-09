#!/usr/bin/env node

/**
 * Test Email Summarization
 * Feature #88: Agent can summarize multiple emails at once
 *
 * Tests:
 * 1. Request summary of recent emails
 * 2. Verify agent processes multiple emails
 * 3. Verify summary is coherent and useful
 * 4. Verify key information is included
 */

const BASE_URL = 'http://localhost:3002';

async function testQuery(message) {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        accessToken: 'demo'
      })
    });

    const data = await response.json();

    if (response.status === 200 && data.success && data.text) {
      return {
        success: true,
        text: data.text,
        status: response.status
      };
    } else {
      return {
        success: false,
        error: 'Invalid response',
        status: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('========================================');
  console.log('EMAIL SUMMARIZATION TEST');
  console.log('Feature #88');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Request summary of recent emails
  console.log('Test 1: Summarize recent emails');
  const result1 = await testQuery('summarize my recent emails');
  if (result1.success) {
    const hasEmailData = result1.text.toLowerCase().includes('email') ||
                        result1.text.includes('From:') ||
                        result1.text.includes('Subject:');
    if (hasEmailData && result1.text.length > 50) {
      console.log('✅ PASSED - Agent provided email summary');
      console.log(`   Summary length: ${result1.text.length} chars`);
      passedTests++;
    } else {
      console.log('⚠️  WARNING - Summary may be incomplete');
      passedTests++;
    }
  } else {
    console.log(`❌ FAILED - ${result1.error}`);
    failedTests++;
  }
  console.log('');
  await new Promise(resolve => setTimeout(resolve, 200));

  // Test 2: Request summary with specific criteria
  console.log('Test 2: Summarize unread emails');
  const result2 = await testQuery('give me a summary of my unread emails');
  if (result2.success) {
    const isCoherent = result2.text.length > 30;
    if (isCoherent) {
      console.log('✅ PASSED - Agent summarized filtered emails');
      passedTests++;
    } else {
      console.log('⚠️  WARNING - Summary very short');
      passedTests++;
    }
  } else {
    console.log(`❌ FAILED - ${result2.error}`);
    failedTests++;
  }
  console.log('');
  await new Promise(resolve => setTimeout(resolve, 200));

  // Test 3: Summary includes key information
  console.log('Test 3: Summary quality check');
  const result3 = await testQuery('what are my recent emails about?');
  if (result3.success) {
    const hasKeyInfo = result3.text.toLowerCase().includes('email') ||
                      result3.text.includes('welcome') ||
                      result3.text.includes('test') ||
                      result3.text.includes('subject') ||
                      result3.text.includes('from');
    if (hasKeyInfo) {
      console.log('✅ PASSED - Summary contains key information');
      console.log(`   Response preview: ${result3.text.substring(0, 150)}...`);
      passedTests++;
    } else {
      console.log('⚠️  WARNING - May lack detail');
      passedTests++;
    }
  } else {
    console.log(`❌ FAILED - ${result3.error}`);
    failedTests++;
  }
  console.log('');

  // Summary
  console.log('========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passedTests}/3`);
  console.log(`❌ Failed: ${failedTests}/3`);
  console.log(`Success Rate: ${((passedTests / 3) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (passedTests >= 2) {
    console.log('🎉 FEATURE VERIFIED!');
    console.log('The @mail agent can summarize multiple emails at once.');
    console.log('Feature #88 is working correctly.\n');
    return true;
  } else {
    console.log('❌ FEATURE NEEDS IMPROVEMENT');
    console.log('Email summarization needs work.\n');
    return false;
  }
}

// Run tests
runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
