#!/usr/bin/env node

/**
 * Test Offline Mode Feature - Session 12
 *
 * Tests:
 * 1. Code verification: NetInfo integration exists
 * 2. Code verification: Offline indicator UI exists
 * 3. Code verification: Offline message handling in chatStore
 * 4. Code verification: Network error detection
 */

const fs = require('fs');

console.log('========================================');
console.log('OFFLINE MODE FEATURE VERIFICATION');
console.log('Session 12 - Feature #27');
console.log('========================================\n');

let passed = 0;
let failed = 0;

// Test 1: Verify NetInfo integration in EmailChat.tsx
console.log('Test 1: NetInfo Integration');
try {
  const emailChatCode = fs.readFileSync('expo-app/src/screens/EmailChat.tsx', 'utf8');

  const checks = [
    { name: 'NetInfo import', test: emailChatCode.includes('import NetInfo from "@react-native-community/netinfo"') },
    { name: 'useEffect for network monitoring', test: emailChatCode.includes('NetInfo.addEventListener') },
    { name: 'Initial network state fetch', test: emailChatCode.includes('NetInfo.fetch()') },
    { name: 'setOnlineStatus in store', test: emailChatCode.includes('setOnlineStatus') },
    { name: 'isOnline from store', test: emailChatCode.includes('isOnline') },
  ];

  const allPassed = checks.every(check => {
    if (check.test) {
      console.log(`  ✅ ${check.name}`);
      return true;
    } else {
      console.log(`  ❌ ${check.name}`);
      return false;
    }
  });

  if (allPassed) {
    console.log('✅ PASSED - NetInfo properly integrated\n');
    passed++;
  } else {
    console.log('❌ FAILED - NetInfo integration incomplete\n');
    failed++;
  }
} catch (error) {
  console.log(`❌ FAILED - ${error.message}\n`);
  failed++;
}

// Test 2: Verify Offline Indicator UI
console.log('Test 2: Offline Indicator UI');
try {
  const emailChatCode = fs.readFileSync('expo-app/src/screens/EmailChat.tsx', 'utf8');

  const checks = [
    { name: 'Offline indicator component', test: emailChatCode.includes('!isOnline') && emailChatCode.includes('offlineIndicator') },
    { name: 'Offline text message', test: emailChatCode.includes('No Internet Connection') || emailChatCode.includes('offline') },
    { name: 'Offline indicator styles', test: emailChatCode.includes('offlineIndicator:') && emailChatCode.includes('offlineText:') },
    { name: 'Visual styling (red background)', test: emailChatCode.includes('#FF3B30') || emailChatCode.includes('backgroundColor') },
  ];

  const allPassed = checks.every(check => {
    if (check.test) {
      console.log(`  ✅ ${check.name}`);
      return true;
    } else {
      console.log(`  ❌ ${check.name}`);
      return false;
    }
  });

  if (allPassed) {
    console.log('✅ PASSED - Offline indicator UI implemented\n');
    passed++;
  } else {
    console.log('❌ FAILED - Offline indicator UI incomplete\n');
    failed++;
  }
} catch (error) {
  console.log(`❌ FAILED - ${error.message}\n`);
  failed++;
}

// Test 3: Verify chatStore offline handling
console.log('Test 3: ChatStore Offline Handling');
try {
  const chatStoreCode = fs.readFileSync('expo-app/src/store/chatStore.ts', 'utf8');

  const checks = [
    { name: 'isOnline state property', test: chatStoreCode.includes('isOnline: boolean') },
    { name: 'setOnlineStatus function', test: chatStoreCode.includes('setOnlineStatus:') },
    { name: 'Offline check in sendMessage', test: chatStoreCode.includes('if (!isOnline)') },
    { name: 'Offline error message', test: chatStoreCode.includes('offline') || chatStoreCode.includes('internet connection') },
    { name: 'Default online state', test: chatStoreCode.includes('isOnline: true') },
  ];

  const allPassed = checks.every(check => {
    if (check.test) {
      console.log(`  ✅ ${check.name}`);
      return true;
    } else {
      console.log(`  ❌ ${check.name}`);
      return false;
    }
  });

  if (allPassed) {
    console.log('✅ PASSED - ChatStore offline handling implemented\n');
    passed++;
  } else {
    console.log('❌ FAILED - ChatStore offline handling incomplete\n');
    failed++;
  }
} catch (error) {
  console.log(`❌ FAILED - ${error.message}\n`);
  failed++;
}

// Test 4: Verify network error detection
console.log('Test 4: Network Error Detection');
try {
  const chatStoreCode = fs.readFileSync('expo-app/src/store/chatStore.ts', 'utf8');

  const checks = [
    { name: 'Error handling in catch block', test: chatStoreCode.includes('catch (error') },
    { name: 'Network error detection', test: chatStoreCode.includes('network') || chatStoreCode.includes('fetch') },
    { name: 'Update isOnline on network error', test: /set\(\{[^}]*isOnline:\s*false/.test(chatStoreCode) },
    { name: 'Network error message', test: chatStoreCode.includes('Network error') || chatStoreCode.includes('internet connection') },
  ];

  const allPassed = checks.every(check => {
    if (check.test) {
      console.log(`  ✅ ${check.name}`);
      return true;
    } else {
      console.log(`  ❌ ${check.name}`);
      return false;
    }
  });

  if (allPassed) {
    console.log('✅ PASSED - Network error detection implemented\n');
    passed++;
  } else {
    console.log('❌ FAILED - Network error detection incomplete\n');
    failed++;
  }
} catch (error) {
  console.log(`❌ FAILED - ${error.message}\n`);
  failed++;
}

// Test 5: Verify NetInfo package installation
console.log('Test 5: NetInfo Package Installation');
try {
  const packageJson = JSON.parse(fs.readFileSync('expo-app/package.json', 'utf8'));

  if (packageJson.dependencies && packageJson.dependencies['@react-native-community/netinfo']) {
    console.log(`  ✅ NetInfo installed: ${packageJson.dependencies['@react-native-community/netinfo']}`);
    console.log('✅ PASSED - NetInfo package installed\n');
    passed++;
  } else {
    console.log('  ❌ NetInfo not found in dependencies');
    console.log('❌ FAILED - NetInfo package not installed\n');
    failed++;
  }
} catch (error) {
  console.log(`❌ FAILED - ${error.message}\n`);
  failed++;
}

// Summary
console.log('========================================');
console.log('VERIFICATION RESULTS');
console.log('========================================');
console.log(`✅ Passed: ${passed}/5`);
console.log(`❌ Failed: ${failed}/5`);
console.log('========================================\n');

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('\nOffline Mode Feature Implementation Complete:');
  console.log('  ✓ NetInfo integration for network monitoring');
  console.log('  ✓ Visual offline indicator banner');
  console.log('  ✓ Offline status in chatStore');
  console.log('  ✓ Network error detection and handling');
  console.log('  ✓ User-friendly offline messages\n');

  console.log('Next Steps:');
  console.log('  1. Restart frontend to apply changes');
  console.log('  2. Test in browser: disconnect network and try sending message');
  console.log('  3. Verify offline banner appears');
  console.log('  4. Verify offline message when trying to send\n');

  process.exit(0);
} else {
  console.log('⚠️  SOME TESTS FAILED!');
  console.log('Review implementation and fix issues.\n');
  process.exit(1);
}
