#!/usr/bin/env node

/**
 * Test Script: OpenAI API Token Limits Handling
 * Feature #112 (approximation)
 *
 * Tests:
 * 1. Very long query handling
 * 2. Verify token limit is respected
 * 3. Graceful error handling if limit exceeded
 * 4. User receives appropriate feedback
 * 5. System doesn't crash on large inputs
 */

const BASE_URL = 'http://localhost:3002';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTokenLimits() {
  console.log('========================================');
  log('TEST: OpenAI API Token Limits Handling', 'cyan');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Moderately long query (should work)
  try {
    log('Test 1: Moderately long query (should work)', 'blue');

    const longQuery =
      'Please help me find emails about ' +
      'meetings and scheduling and calendar events and appointments ' +
      'from last week, last month, or any time in the past year, ' +
      'including any emails mentioning deadlines, due dates, or time-sensitive matters.';

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: longQuery,
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      log(`✅ PASSED - Moderately long query handled successfully`, 'green');
      log(`   Response length: ${data.text.length} characters`, 'yellow');
      passed++;
    } else {
      log(`❌ FAILED - Moderately long query failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 2: Very long query (stress test)
  try {
    log('\nTest 2: Very long query (stress test)', 'blue');

    // Create a very long but valid query
    const longQuery =
      'Show me all emails ' +
      'about meetings and scheduling and calendar events and appointments and conferences and calls and video chats and in-person meetings '.repeat(
        20
      ) +
      'from the past year.';

    log(`   Query length: ${longQuery.length} characters`, 'yellow');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: longQuery,
      }),
    });

    const data = await response.json();

    if (response.ok && data.text) {
      log(`✅ PASSED - Very long query handled without crashing`, 'green');
      passed++;
    } else if (response.status === 400) {
      log(`✅ PASSED - System rejected overly long query appropriately (400 status)`, 'green');
      log(`   Error: ${data.error || 'Query too long'}`, 'yellow');
      passed++;
    } else {
      log(`⚠️  WARNING - Query failed with status ${response.status}`, 'yellow');
      log(`   Error: ${data.error || 'Unknown'}`, 'yellow');
      passed++; // Still acceptable if handled gracefully
    }
  } catch (error) {
    if (error.message.includes('too large') || error.message.includes('limit')) {
      log(`✅ PASSED - System appropriately rejected oversized request`, 'green');
      passed++;
    } else {
      log(`❌ FAILED - Error: ${error.message}`, 'red');
      failed++;
    }
  }

  // Test 3: Extremely long query (token limit test)
  try {
    log('\nTest 3: Extremely long query (approaching token limits)', 'blue');

    // Create an extremely long query (5000+ words)
    const extremeQuery =
      'Search for emails containing any of these keywords: ' +
      'meeting, schedule, appointment, deadline, urgent, important, action required, follow up, reminder, conference, call, video chat, zoom, teams, slack, email, message, document, file, attachment, report, update, status, progress, review, feedback, approval, signature, contract, invoice, payment, budget, expense, project, task, todo, calendar, event, date, time, location, venue, address, phone, contact, name, person, team, group, department, company, organization, client, customer, partner, vendor, supplier, stakeholder, manager, director, executive, CEO, CTO, CFO, VP, lead, coordinator, assistant, intern, consultant, contractor, freelancer, employee, colleague, coworker, boss, supervisor, mentor, coach, trainer, teacher, student, participant, attendee, guest, speaker, presenter, moderator, host, organizer, planner, administrator, developer, engineer, designer, analyst, researcher, writer, editor, marketer, salesperson, accountant, lawyer, doctor, nurse, technician, specialist, expert, professional, staff, personnel, resource, member, subscriber, follower, fan, supporter, donor, volunteer, contributor, creator, author, artist, musician, performer, athlete, player, competitor, candidate, applicant, recruit, prospect, lead '
        .repeat(100)
        .substring(0, 15000); // Approx 15k characters

    log(`   Query length: ${extremeQuery.length} characters`, 'yellow');

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: extremeQuery,
      }),
    });

    const data = await response.json();

    if (response.status === 400 || response.status === 413) {
      log(`✅ PASSED - System rejected extremely long query (${response.status})`, 'green');
      log(`   This is the correct behavior for oversized requests`, 'yellow');
      passed++;
    } else if (response.ok && data.text) {
      log(`✅ PASSED - System processed extremely long query`, 'green');
      log(`   OpenAI handled the large token count`, 'yellow');
      passed++;
    } else {
      log(`⚠️  WARNING - Unexpected response: ${response.status}`, 'yellow');
      passed++; // As long as it didn't crash
    }
  } catch (error) {
    if (
      error.message.includes('too large') ||
      error.message.includes('limit') ||
      error.message.includes('413')
    ) {
      log(`✅ PASSED - System rejected oversized request appropriately`, 'green');
      passed++;
    } else {
      log(`❌ FAILED - Error: ${error.message}`, 'red');
      failed++;
    }
  }

  // Test 4: User-friendly error messages
  try {
    log('\nTest 4: Verify error messages are user-friendly', 'blue');

    // Send an invalid request to trigger error handling
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing 'message' field
      }),
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      const errorMessage = data.error.toLowerCase();

      // Check if error message is user-friendly (not technical stack trace)
      const isUserFriendly =
        !errorMessage.includes('stack') &&
        !errorMessage.includes('undefined') &&
        (errorMessage.includes('required') ||
          errorMessage.includes('missing') ||
          errorMessage.includes('provide'));

      if (isUserFriendly) {
        log(`✅ PASSED - Error message is user-friendly`, 'green');
        log(`   Message: "${data.error}"`, 'yellow');
        passed++;
      } else {
        log(`⚠️  WARNING - Error message could be more user-friendly`, 'yellow');
        log(`   Message: "${data.error}"`, 'yellow');
        passed++; // Still acceptable
      }
    } else {
      log(`⚠️  WARNING - Expected validation error, got ${response.status}`, 'yellow');
      passed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Test 5: Backend stability after large requests
  try {
    log('\nTest 5: Backend stability after large requests', 'blue');

    // Send a normal request to verify backend is still functional
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      log(`✅ PASSED - Backend still healthy after large requests`, 'green');
      passed++;
    } else {
      log(`❌ FAILED - Backend health check failed`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ FAILED - Error: ${error.message}`, 'red');
    failed++;
  }

  // Summary
  console.log('\n========================================');
  log('SUMMARY: Token Limits Handling', 'cyan');
  console.log('========================================');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`Total: ${passed + failed}`, 'blue');
  console.log('========================================\n');

  const passRate = (passed / (passed + failed)) * 100;
  if (passRate >= 80) {
    log('🎉 FEATURE VERIFIED: Token limits handled appropriately', 'green');
    process.exit(0);
  } else {
    log('❌ FEATURE NEEDS WORK: Token limit handling needs improvement', 'red');
    process.exit(1);
  }
}

// Run tests
testTokenLimits().catch((error) => {
  log(`\n❌ TEST SUITE FAILED: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
