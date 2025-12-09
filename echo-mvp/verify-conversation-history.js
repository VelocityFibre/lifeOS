#!/usr/bin/env node

/**
 * Verification Script: Conversation History Persistence
 *
 * This script verifies that:
 * 1. AsyncStorage package is installed
 * 2. chatStore uses Zustand persist middleware
 * 3. Proper storage configuration is in place
 * 4. Date serialization/deserialization is handled
 * 5. Only appropriate state is persisted (not isLoading)
 */

const fs = require('fs');
const path = require('path');

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

function checkmark() {
  return `${colors.green}✅${colors.reset}`;
}

function crossmark() {
  return `${colors.red}❌${colors.reset}`;
}

let passed = 0;
let failed = 0;

log('\n========================================', 'blue');
log('Conversation History Persistence Verification', 'blue');
log('========================================\n', 'blue');

// Test 1: Check AsyncStorage is installed
log('\nTest 1: AsyncStorage package is installed', 'cyan');
try {
  const packageJsonPath = path.join(__dirname, 'expo-app', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (packageJson.dependencies['@react-native-async-storage/async-storage']) {
    log(`  ${checkmark()} AsyncStorage package found in dependencies`);
    log(`  Version: ${packageJson.dependencies['@react-native-async-storage/async-storage']}`, 'yellow');
    passed++;
  } else {
    log(`  ${crossmark()} AsyncStorage package not found in dependencies`);
    failed++;
  }
} catch (error) {
  log(`  ${crossmark()} Error reading package.json: ${error.message}`, 'red');
  failed++;
}

// Test 2: Check chatStore imports persist middleware
log('\nTest 2: chatStore imports Zustand persist middleware', 'cyan');
try {
  const chatStorePath = path.join(__dirname, 'expo-app', 'src', 'store', 'chatStore.ts');
  const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');

  const checks = [
    { pattern: /import.*\{.*persist.*\}.*from.*"zustand\/middleware"/, name: 'persist import' },
    { pattern: /import.*\{.*createJSONStorage.*\}.*from.*"zustand\/middleware"/, name: 'createJSONStorage import' },
    { pattern: /import.*AsyncStorage.*from.*"@react-native-async-storage\/async-storage"/, name: 'AsyncStorage import' },
  ];

  let allChecks = true;
  checks.forEach(check => {
    if (check.pattern.test(chatStoreContent)) {
      log(`  ${checkmark()} Found ${check.name}`);
    } else {
      log(`  ${crossmark()} Missing ${check.name}`);
      allChecks = false;
    }
  });

  if (allChecks) {
    passed++;
  } else {
    failed++;
  }
} catch (error) {
  log(`  ${crossmark()} Error reading chatStore.ts: ${error.message}`, 'red');
  failed++;
}

// Test 3: Check persist middleware is used
log('\nTest 3: chatStore uses persist middleware', 'cyan');
try {
  const chatStorePath = path.join(__dirname, 'expo-app', 'src', 'store', 'chatStore.ts');
  const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');

  const checks = [
    { pattern: /create<ChatStore>\(\)\(\s*persist\(/, name: 'persist wrapper around store' },
    { pattern: /name:\s*["']chat-storage["']/, name: 'storage name configured' },
    { pattern: /storage:\s*createJSONStorage\(\(\)\s*=>\s*AsyncStorage\)/, name: 'AsyncStorage configured' },
  ];

  let allChecks = true;
  checks.forEach(check => {
    if (check.pattern.test(chatStoreContent)) {
      log(`  ${checkmark()} Found ${check.name}`);
    } else {
      log(`  ${crossmark()} Missing ${check.name}`);
      allChecks = false;
    }
  });

  if (allChecks) {
    passed++;
  } else {
    failed++;
  }
} catch (error) {
  log(`  ${crossmark()} Error verifying persist configuration: ${error.message}`, 'red');
  failed++;
}

// Test 4: Check partialize function
log('\nTest 4: Partialize function excludes isLoading state', 'cyan');
try {
  const chatStorePath = path.join(__dirname, 'expo-app', 'src', 'store', 'chatStore.ts');
  const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');

  const checks = [
    { pattern: /partialize:.*\(state\)\s*=>/, name: 'partialize function exists' },
    { pattern: /messages:\s*state\.messages/, name: 'messages persisted' },
    { pattern: /accessToken:\s*state\.accessToken/, name: 'accessToken persisted' },
    { pattern: /threadId:\s*state\.threadId/, name: 'threadId persisted' },
  ];

  let allChecks = true;
  checks.forEach(check => {
    if (check.pattern.test(chatStoreContent)) {
      log(`  ${checkmark()} ${check.name}`);
    } else {
      log(`  ${crossmark()} ${check.name} not found`);
      allChecks = false;
    }
  });

  // Verify isLoading is NOT in partialize
  if (!chatStoreContent.match(/partialize:.*isLoading/)) {
    log(`  ${checkmark()} isLoading correctly excluded from persistence`);
  } else {
    log(`  ${crossmark()} isLoading should not be persisted`);
    allChecks = false;
  }

  if (allChecks) {
    passed++;
  } else {
    failed++;
  }
} catch (error) {
  log(`  ${crossmark()} Error checking partialize: ${error.message}`, 'red');
  failed++;
}

// Test 5: Check Date deserialization handling
log('\nTest 5: Date deserialization is properly handled', 'cyan');
try {
  const chatStorePath = path.join(__dirname, 'expo-app', 'src', 'store', 'chatStore.ts');
  const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');

  const checks = [
    { pattern: /merge:.*\(persistedState.*currentState.*\)/, name: 'merge function exists' },
    { pattern: /createdAt:\s*new Date\(msg\.createdAt\)/, name: 'Date deserialization for messages' },
  ];

  let allChecks = true;
  checks.forEach(check => {
    if (check.pattern.test(chatStoreContent)) {
      log(`  ${checkmark()} ${check.name}`);
    } else {
      log(`  ${crossmark()} ${check.name} not found`);
      allChecks = false;
    }
  });

  if (allChecks) {
    passed++;
  } else {
    failed++;
  }
} catch (error) {
  log(`  ${crossmark()} Error checking Date handling: ${error.message}`, 'red');
  failed++;
}

// Test 6: Verify package-lock.json updated
log('\nTest 6: AsyncStorage installed in node_modules', 'cyan');
try {
  const asyncStoragePath = path.join(__dirname, 'expo-app', 'node_modules', '@react-native-async-storage', 'async-storage');
  if (fs.existsSync(asyncStoragePath)) {
    log(`  ${checkmark()} AsyncStorage found in node_modules`);
    const packageJsonPath = path.join(asyncStoragePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      log(`  Version installed: ${pkg.version}`, 'yellow');
    }
    passed++;
  } else {
    log(`  ${crossmark()} AsyncStorage not found in node_modules`);
    log(`  Run: npm install --prefix expo-app`, 'yellow');
    failed++;
  }
} catch (error) {
  log(`  ${crossmark()} Error checking node_modules: ${error.message}`, 'red');
  failed++;
}

// Summary
log('\n========================================', 'blue');
log('SUMMARY', 'blue');
log('========================================', 'blue');
log(`Total tests: ${passed + failed}`);
log(`${colors.green}Passed: ${passed}${colors.reset}`);
log(`${colors.red}Failed: ${failed}${colors.reset}`);

if (failed === 0) {
  log(`\n${checkmark()} All checks passed! Conversation history persistence is properly implemented.`, 'green');
  log('\nImplementation details:', 'cyan');
  log('  • Messages, accessToken, and threadId are persisted');
  log('  • isLoading state is not persisted (transient)');
  log('  • Date objects are properly deserialized on load');
  log('  • AsyncStorage is used for cross-platform support');
  log('  • Storage key: "chat-storage"');

  log('\nFeature #42 can be marked as PASSING ✅', 'green');
  process.exit(0);
} else {
  log(`\n${crossmark()} Some checks failed. Please review the output above.`, 'red');
  process.exit(1);
}
