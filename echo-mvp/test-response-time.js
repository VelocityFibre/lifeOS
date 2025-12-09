#!/usr/bin/env node

/**
 * Test Suite: Response Time Performance
 *
 * This script tests Feature #28: Response time is acceptable (< 2 seconds)
 *
 * Tests:
 * 1. Simple query response time
 * 2. Multiple queries for consistency
 * 3. Average response time
 */

const API_BASE = 'http://localhost:3002';
const TARGET_TIME_MS = 2000; // 2 seconds

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function measureResponseTime(query) {
  const startTime = Date.now();

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      threadId: `test-perf-${Date.now()}`
    })
  });

  const data = await response.json();
  const endTime = Date.now();
  const duration = endTime - startTime;

  return {
    duration,
    success: data.success,
    responseLength: data.text ? data.text.length : 0
  };
}

async function runPerformanceTest() {
  log('========================================', 'blue');
  log('Response Time Performance Test', 'blue');
  log('========================================\n', 'blue');

  // Check backend is available
  try {
    const healthCheck = await fetch(`${API_BASE}/health`);
    const health = await healthCheck.json();
    log(`Backend Status: ${health.status}`, 'yellow');
  } catch (error) {
    log('❌ Backend is not running!', 'red');
    process.exit(1);
  }

  // Test queries
  const queries = [
    'show me my unread emails',
    'list emails from today',
    'what are my recent emails'
  ];

  log(`\nTarget response time: < ${TARGET_TIME_MS}ms (${TARGET_TIME_MS / 1000}s)\n`, 'cyan');

  const results = [];
  let testsPassed = 0;
  let testsFailed = 0;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    log(`\nTest ${i + 1}/3: "${query}"`, 'cyan');

    try {
      const result = await measureResponseTime(query);

      const passed = result.duration < TARGET_TIME_MS;
      const status = passed ? '✅ PASS' : '⚠️  SLOW';
      const statusColor = passed ? 'green' : 'yellow';

      log(`  Duration: ${result.duration}ms`, statusColor);
      log(`  Response: ${result.responseLength} characters`, 'yellow');
      log(`  ${status}`, statusColor);

      results.push(result);

      if (passed) {
        testsPassed++;
      } else {
        testsFailed++;
      }
    } catch (error) {
      log(`  ❌ Error: ${error.message}`, 'red');
      testsFailed++;
    }
  }

  // Calculate statistics
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = totalDuration / results.length;
  const minDuration = Math.min(...results.map(r => r.duration));
  const maxDuration = Math.max(...results.map(r => r.duration));

  log('\n========================================', 'blue');
  log('Performance Statistics', 'blue');
  log('========================================', 'blue');
  log(`Tests Run: ${results.length}`, 'cyan');
  log(`Passed (<2s): ${testsPassed}`, 'green');
  log(`Slow (≥2s): ${testsFailed}`, testsFailed > 0 ? 'yellow' : 'green');
  log(`\nMin Response Time: ${minDuration}ms`, 'cyan');
  log(`Max Response Time: ${maxDuration}ms`, 'cyan');
  log(`Avg Response Time: ${Math.round(avgDuration)}ms`, 'cyan');

  const overallPassed = avgDuration < TARGET_TIME_MS && testsPassed >= 2;
  log(`\nOverall Result: ${overallPassed ? '✅ PASSED' : '⚠️  NEEDS OPTIMIZATION'}`, overallPassed ? 'green' : 'yellow');
  log('========================================\n', 'blue');

  // Feature passes if average is under 2s and at least 2/3 individual tests pass
  if (overallPassed) {
    log('✅ Feature #28 PASSES: Response time is acceptable', 'green');
    process.exit(0);
  } else {
    log('⚠️  Feature #28 needs optimization', 'yellow');
    log('Note: AI agent responses may vary. Consider optimizations:', 'yellow');
    log('  - Reduce prompt complexity', 'yellow');
    log('  - Use caching for common queries', 'yellow');
    log('  - Use faster AI model for simple queries', 'yellow');
    process.exit(1);
  }
}

runPerformanceTest();
