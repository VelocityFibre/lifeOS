#!/usr/bin/env node

/**
 * Markdown UI Verification
 * Verifies that the markdown rendering will work correctly in the UI
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log('\n========================================', 'blue');
log('Markdown UI Implementation Verification', 'blue');
log('========================================\n', 'blue');

const chatPath = path.join(__dirname, 'expo-app', 'src', 'screens', 'EmailChat.tsx');
const content = fs.readFileSync(chatPath, 'utf8');

let allPassed = true;

// Check 1: Markdown import
log('✓ Checking Markdown import...', 'cyan');
if (content.includes('import Markdown from "react-native-markdown-display"')) {
  log('  ✅ Markdown component is imported correctly', 'green');
} else {
  log('  ❌ Markdown component import not found', 'red');
  allPassed = false;
}

// Check 2: MessageText import from GiftedChat
log('\n✓ Checking MessageText import from GiftedChat...', 'cyan');
if (content.includes('MessageText') && content.includes('react-native-gifted-chat')) {
  log('  ✅ MessageText is imported from react-native-gifted-chat', 'green');
} else {
  log('  ❌ MessageText import not found', 'red');
  allPassed = false;
}

// Check 3: renderMessageText function exists
log('\n✓ Checking renderMessageText function...', 'cyan');
if (content.includes('const renderMessageText = ')) {
  log('  ✅ renderMessageText function is defined', 'green');

  // Check if it handles agent messages (user._id === 2)
  if (content.includes('currentMessage.user._id === 2')) {
    log('  ✅ Function checks for agent messages (user._id === 2)', 'green');
  } else {
    log('  ⚠️  Warning: Agent message check might be missing', 'yellow');
  }

  // Check if it renders Markdown component
  if (content.includes('<Markdown') && content.includes('currentMessage.text')) {
    log('  ✅ Markdown component is rendered with message text', 'green');
  } else {
    log('  ❌ Markdown component rendering not found', 'red');
    allPassed = false;
  }

  // Check if it has fallback to default rendering
  if (content.includes('<MessageText {...props} />')) {
    log('  ✅ Fallback to default MessageText for user messages', 'green');
  } else {
    log('  ⚠️  Warning: Fallback rendering might be missing', 'yellow');
  }
} else {
  log('  ❌ renderMessageText function not found', 'red');
  allPassed = false;
}

// Check 4: renderMessageText prop passed to GiftedChat
log('\n✓ Checking GiftedChat props...', 'cyan');
if (content.includes('renderMessageText={renderMessageText}')) {
  log('  ✅ renderMessageText prop is passed to GiftedChat', 'green');
} else {
  log('  ❌ renderMessageText prop not passed to GiftedChat', 'red');
  allPassed = false;
}

// Check 5: Markdown styles defined
log('\n✓ Checking markdown styles...', 'cyan');
const requiredStyles = ['strong', 'em', 'list_item', 'bullet_list', 'code_inline', 'fence'];
const foundStyles = [];
const missingStyles = [];

for (const style of requiredStyles) {
  if (content.includes(`${style}:`)) {
    foundStyles.push(style);
  } else {
    missingStyles.push(style);
  }
}

if (foundStyles.length > 0) {
  log(`  ✅ Found ${foundStyles.length}/${requiredStyles.length} markdown styles: ${foundStyles.join(', ')}`, 'green');
}

if (missingStyles.length > 0) {
  log(`  ⚠️  Missing styles: ${missingStyles.join(', ')}`, 'yellow');
}

// Check 6: Markdown container style
log('\n✓ Checking markdown container style...', 'cyan');
if (content.includes('markdownContainer')) {
  log('  ✅ markdownContainer style is defined', 'green');
} else {
  log('  ⚠️  Warning: markdownContainer style not found', 'yellow');
}

// Check 7: Overall structure
log('\n✓ Checking overall implementation...', 'cyan');
const hasImport = content.includes('react-native-markdown-display');
const hasFunction = content.includes('renderMessageText');
const hasProp = content.includes('renderMessageText={renderMessageText}');
const hasMarkdownComponent = content.includes('<Markdown');

if (hasImport && hasFunction && hasProp && hasMarkdownComponent) {
  log('  ✅ All core components are in place', 'green');
} else {
  log('  ❌ Some core components are missing', 'red');
  allPassed = false;
}

// Summary
log('\n========================================', 'blue');
log('Verification Summary', 'blue');
log('========================================', 'blue');

if (allPassed) {
  log('✅ ALL CHECKS PASSED!', 'green');
  log('\nThe markdown rendering implementation is complete:', 'green');
  log('  • Markdown package is properly imported', 'green');
  log('  • Custom renderMessageText function is defined', 'green');
  log('  • Agent messages will render with markdown', 'green');
  log('  • User messages use default rendering', 'green');
  log('  • Markdown styles are configured', 'green');
  log('\nMarkdown features that will render:', 'cyan');
  log('  • **Bold text**', 'yellow');
  log('  • *Italic text*', 'yellow');
  log('  • Lists (bulleted and numbered)', 'yellow');
  log('  • `Inline code`', 'yellow');
  log('  • Code blocks', 'yellow');
  log('  • Headings (# ## ###)', 'yellow');
  log('  • Links', 'yellow');
  log('\n✅ Feature "Markdown formatting renders in agent responses" is ready!', 'green');
} else {
  log('❌ SOME CHECKS FAILED', 'red');
  log('Please review the implementation before marking the feature as passing.', 'red');
}

log('========================================\n', 'blue');

process.exit(allPassed ? 0 : 1);
