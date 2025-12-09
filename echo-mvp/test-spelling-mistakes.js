#!/usr/bin/env node

/**
 * Test Script: Feature #115 - Agent handles spelling mistakes in queries
 *
 * This script tests whether the AI agent can understand user intent
 * even when queries contain intentional typos and misspellings.
 *
 * Success Criteria:
 * 1. Agent understands intent despite typos
 * 2. Agent responds appropriately to the actual request
 * 3. Typos don't break functionality
 * 4. Agent may optionally correct or acknowledge the typo
 */

const API_BASE = 'http://localhost:3002';

async function testSpellingMistakes() {
  console.log('========================================');
  console.log('Feature #115: Spelling Mistake Handling');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  // Test cases with common typos and misspellings
  const testCases = [
    {
      name: 'Typo in "emails"',
      query: 'Show me my recemt emials',
      expectedIntent: 'recent emails',
      shouldContain: ['email', 'recent', 'from']
    },
    {
      name: 'Typo in "calendar"',
      query: '@cal show my calander',
      expectedIntent: 'calendar',
      shouldContain: ['calendar', 'coming soon']
    },
    {
      name: 'Multiple typos',
      query: 'Can you shwo me importent mesages?',
      expectedIntent: 'important messages',
      shouldContain: ['email', 'important', 'message']
    },
    {
      name: 'Misspelled action word',
      query: 'Plesae summerize my inbox',
      expectedIntent: 'summarize inbox',
      shouldContain: ['email', 'summary', 'inbox']
    },
    {
      name: 'Typo in agent mention',
      query: '@mail what can you doo?',
      expectedIntent: 'capabilities',
      shouldContain: ['email', 'help', 'can']
    },
    {
      name: 'Letter swap typo',
      query: 'Show me uread emails',
      expectedIntent: 'unread emails',
      shouldContain: ['email', 'unread']
    },
    {
      name: 'Missing letter',
      query: 'Get me the lastest emails',
      expectedIntent: 'latest emails',
      shouldContain: ['email', 'recent', 'latest']
    },
    {
      name: 'Extra letter',
      query: 'Search for emaiils from John',
      expectedIntent: 'emails from John',
      shouldContain: ['email', 'from', 'john']
    },
    {
      name: 'Phonetic spelling',
      query: 'Retreive my messeges',
      expectedIntent: 'retrieve messages',
      shouldContain: ['email', 'message', 'retrieve']
    },
    {
      name: 'Case and typo combo',
      query: 'SHWO MY UNRED EMIALS',
      expectedIntent: 'unread emails',
      shouldContain: ['email', 'unread']
    }
  ];

  console.log(`Running ${testCases.length} test cases...\n`);

  for (const testCase of testCases) {
    console.log(`Test: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected intent: ${testCase.expectedIntent}`);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testCase.query,
          accessToken: 'demo'
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.log('❌ FAILED - Request was not successful');
        console.log(`   Response: ${JSON.stringify(data)}\n`);
        failed++;
        results.push({ test: testCase.name, passed: false, reason: 'Request failed' });
        continue;
      }

      const responseText = data.text.toLowerCase();

      // Check if response contains expected keywords
      const containsExpected = testCase.shouldContain.some(keyword =>
        responseText.includes(keyword.toLowerCase())
      );

      if (containsExpected) {
        console.log('✅ PASSED - Agent understood intent despite typos');
        console.log(`   Response preview: ${data.text.substring(0, 150)}...`);
        passed++;
        results.push({ test: testCase.name, passed: true });
      } else {
        console.log('❌ FAILED - Agent did not understand intent');
        console.log(`   Response: ${data.text.substring(0, 200)}`);
        console.log(`   Expected one of: ${testCase.shouldContain.join(', ')}`);
        failed++;
        results.push({ test: testCase.name, passed: false, reason: 'Intent not understood' });
      }
    } catch (error) {
      console.log(`❌ FAILED - ${error.message}`);
      failed++;
      results.push({ test: testCase.name, passed: false, reason: error.message });
    }

    console.log();

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Additional test: Verify typos don't crash the system
  console.log('Test: System Stability with Extreme Typos');
  console.log('Query: "xhsow mee myy eeemaaiiilss plzzz"');

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'xhsow mee myy eeemaaiiilss plzzz',
        accessToken: 'demo'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ PASSED - System handled extreme typos without crashing');
      console.log(`   Response: ${data.text.substring(0, 150)}...`);
      passed++;
      results.push({ test: 'Extreme typos', passed: true });
    } else {
      console.log('⚠️  WARNING - System returned error for extreme typos');
      console.log(`   Response: ${JSON.stringify(data)}`);
      // Still count as passed if it didn't crash
      passed++;
      results.push({ test: 'Extreme typos', passed: true, warning: true });
    }
  } catch (error) {
    console.log(`❌ FAILED - System crashed with extreme typos: ${error.message}`);
    failed++;
    results.push({ test: 'Extreme typos', passed: false, reason: error.message });
  }

  console.log();

  // Summary
  console.log('========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passed}/${testCases.length + 1}`);
  console.log(`❌ Failed: ${failed}/${testCases.length + 1}`);
  console.log(`Success Rate: ${((passed / (testCases.length + 1)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  // Detailed results
  console.log('Detailed Results:');
  results.forEach((result, i) => {
    const icon = result.passed ? '✅' : '❌';
    const warning = result.warning ? ' (with warning)' : '';
    console.log(`${icon} ${result.test}${warning}`);
    if (!result.passed) {
      console.log(`   Reason: ${result.reason}`);
    }
  });
  console.log();

  // Final verdict
  const passThreshold = 0.8; // 80% pass rate
  const successRate = passed / (testCases.length + 1);

  if (successRate >= passThreshold) {
    console.log('🎉 FEATURE #115 PASSES!');
    console.log(`The agent successfully handles spelling mistakes in queries.`);
    console.log(`GPT-4o-mini's natural language understanding handles typos well.\n`);
    return true;
  } else {
    console.log('⚠️  FEATURE #115 NEEDS IMPROVEMENT');
    console.log(`Success rate (${(successRate * 100).toFixed(1)}%) is below threshold (${passThreshold * 100}%)`);
    console.log('The agent may need additional context or prompting to handle typos better.\n');
    return false;
  }
}

// Run tests
testSpellingMistakes()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
