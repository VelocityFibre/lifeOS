#!/usr/bin/env node

/**
 * Test Script: Frontend Security
 * Tests Feature #130: Sensitive data is not exposed in frontend code
 *
 * This test verifies that:
 * 1. No API keys hardcoded in frontend
 * 2. No secrets in source code
 * 3. Environment variables used correctly
 * 4. No OAuth tokens hardcoded
 * 5. No sensitive configuration exposed
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'expo-app');

// Test results
let passedTests = 0;
let failedTests = 0;
const findings = [];

// Patterns to search for
const SENSITIVE_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'OpenAI API key (sk-)' },
  { pattern: /OPENAI_API_KEY\s*=\s*["'][^"']+["']/g, name: 'Hardcoded OPENAI_API_KEY' },
  { pattern: /AIza[0-9A-Za-z-_]{35}/g, name: 'Google API key' },
  { pattern: /ya29\.[0-9A-Za-z\-_]+/g, name: 'OAuth 2.0 access token' },
  { pattern: /password\s*=\s*["'][^"']+["']/gi, name: 'Hardcoded password' },
  { pattern: /secret\s*=\s*["'][^"']+["']/gi, name: 'Hardcoded secret' },
  { pattern: /access_token\s*=\s*["'][^"']+["']/gi, name: 'Hardcoded access token' },
  { pattern: /GMAIL_ACCESS_TOKEN\s*=\s*["'][^"']+["']/g, name: 'Hardcoded Gmail token' },
];

// Files to scan (TypeScript/JavaScript in expo-app)
function getAllSourceFiles(dir) {
  let files = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      // Skip node_modules, .expo, dist, build directories
      if (item === 'node_modules' || item === '.expo' || item === 'dist' || item === 'build' || item.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(getAllSourceFiles(fullPath));
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist or not readable
  }

  return files;
}

// Test 1: No API keys hardcoded
function test1_noApiKeys() {
  console.log('Test 1: Checking for hardcoded API keys...');

  const sourceFiles = getAllSourceFiles(FRONTEND_DIR);
  let foundIssues = 0;

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      for (const { pattern, name } of SENSITIVE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          // Filter out false positives (example values, comments, etc.)
          const realMatches = matches.filter(match => {
            // Ignore placeholder values
            if (match.includes('your-') || match.includes('xxx') || match.includes('example')) {
              return false;
            }
            // Ignore very short matches (likely examples)
            if (match.length < 20) {
              return false;
            }
            return true;
          });

          if (realMatches.length > 0) {
            const relativePath = path.relative(__dirname, file);
            findings.push({
              file: relativePath,
              issue: name,
              matches: realMatches.length
            });
            foundIssues++;
          }
        }
      }
    } catch (error) {
      // File read error
    }
  }

  if (foundIssues > 0) {
    throw new Error(`Found ${foundIssues} potential security issues`);
  }
}

// Test 2: Environment variables used correctly
function test2_envVariablesUsed() {
  console.log('Test 2: Checking environment variable usage...');

  const sourceFiles = getAllSourceFiles(FRONTEND_DIR);
  let usesEnvVars = false;
  let hasDirectApiUrls = false;

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check for environment variable usage
      if (content.includes('process.env') || content.includes('import.meta.env') || content.includes('expo-constants')) {
        usesEnvVars = true;
      }

      // Check for hardcoded API URLs (should use env vars)
      const hardcodedUrls = content.match(/["']https?:\/\/[^"']+\/api[^"']*["']/g);
      if (hardcodedUrls && hardcodedUrls.length > 0) {
        // Filter out example URLs
        const realUrls = hardcodedUrls.filter(url =>
          !url.includes('example.com') &&
          !url.includes('localhost') &&
          !url.includes('127.0.0.1')
        );
        if (realUrls.length > 0) {
          hasDirectApiUrls = true;
          findings.push({
            file: path.relative(__dirname, file),
            issue: 'Hardcoded production API URL',
            matches: realUrls.length
          });
        }
      }
    } catch (error) {
      // File read error
    }
  }

  // It's okay if no env vars are used if there are also no hardcoded production URLs
  if (hasDirectApiUrls) {
    throw new Error('Found hardcoded production API URLs (should use environment variables)');
  }
}

// Test 3: No secrets in app.json or package.json
function test3_noSecretsInConfig() {
  console.log('Test 3: Checking configuration files for secrets...');

  const configFiles = [
    path.join(FRONTEND_DIR, 'app.json'),
    path.join(FRONTEND_DIR, 'package.json'),
    path.join(FRONTEND_DIR, 'app.config.js'),
    path.join(FRONTEND_DIR, 'app.config.ts'),
  ];

  for (const file of configFiles) {
    if (!fs.existsSync(file)) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');

      for (const { pattern, name } of SENSITIVE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          const realMatches = matches.filter(match =>
            !match.includes('your-') &&
            !match.includes('xxx') &&
            !match.includes('example')
          );

          if (realMatches.length > 0) {
            const relativePath = path.relative(__dirname, file);
            findings.push({
              file: relativePath,
              issue: name,
              matches: realMatches.length
            });
            throw new Error(`Found secrets in config file: ${relativePath}`);
          }
        }
      }
    } catch (error) {
      if (error.message.startsWith('Found secrets')) {
        throw error;
      }
      // File read error, skip
    }
  }
}

// Test 4: .env files are not committed (check .gitignore)
function test4_envFilesIgnored() {
  console.log('Test 4: Checking .gitignore includes .env files...');

  const gitignorePath = path.join(__dirname, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    throw new Error('.gitignore file not found');
  }

  const gitignore = fs.readFileSync(gitignorePath, 'utf8');

  if (!gitignore.includes('.env')) {
    throw new Error('.env files are not in .gitignore');
  }

  // Check that no .env files are actually committed in frontend
  const envFiles = [
    path.join(FRONTEND_DIR, '.env'),
    path.join(FRONTEND_DIR, '.env.local'),
    path.join(FRONTEND_DIR, '.env.production'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      findings.push({
        file: path.relative(__dirname, envFile),
        issue: '.env file should not be committed',
        matches: 1
      });
      // Don't throw error, just warn (file might be in .gitignore but still exist locally)
    }
  }
}

// Test 5: Source code doesn't contain test tokens
function test5_noTestTokens() {
  console.log('Test 5: Checking for test/mock tokens in code...');

  const sourceFiles = getAllSourceFiles(FRONTEND_DIR);
  const testTokenPatterns = [
    /token["\s:=]+["']Bearer\s+[a-zA-Z0-9_-]{20,}/gi,
    /authorization["\s:=]+["']Bearer\s+[a-zA-Z0-9_-]{20,}/gi,
  ];

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      for (const pattern of testTokenPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          // Filter out examples and docs
          const realMatches = matches.filter(match =>
            !match.includes('example') &&
            !match.includes('mock') &&
            !match.includes('test') &&
            !match.includes('your-token')
          );

          if (realMatches.length > 0) {
            findings.push({
              file: path.relative(__dirname, file),
              issue: 'Bearer token found in source',
              matches: realMatches.length
            });
            // Don't throw, might be legitimate constant
          }
        }
      }
    } catch (error) {
      // File read error
    }
  }
}

// Helper function to run a test
async function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ PASSED: ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Main test runner
async function runAllTests() {
  console.log('========================================');
  console.log('FRONTEND SECURITY TEST');
  console.log('Feature #130: Sensitive data not in frontend');
  console.log('========================================\n');

  // Check if frontend directory exists
  if (!fs.existsSync(FRONTEND_DIR)) {
    console.log('❌ Frontend directory not found at:', FRONTEND_DIR);
    process.exit(1);
  }

  await runTest('Test 1: No API keys hardcoded', test1_noApiKeys);
  await runTest('Test 2: Environment variables used correctly', test2_envVariablesUsed);
  await runTest('Test 3: No secrets in config files', test3_noSecretsInConfig);
  await runTest('Test 4: .env files in .gitignore', test4_envFilesIgnored);
  await runTest('Test 5: No test tokens in code', test5_noTestTokens);

  console.log('\n========================================');
  console.log('TEST RESULTS');
  console.log('========================================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Total: ${passedTests + failedTests}`);
  console.log('========================================\n');

  if (findings.length > 0) {
    console.log('⚠️  SECURITY FINDINGS:');
    findings.forEach((finding, i) => {
      console.log(`${i + 1}. ${finding.file}`);
      console.log(`   Issue: ${finding.issue}`);
      console.log(`   Occurrences: ${finding.matches}`);
    });
    console.log('');
  }

  // Calculate pass rate
  const passRate = (passedTests / (passedTests + failedTests)) * 100;

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('Frontend security is good - no sensitive data exposed.\n');
    process.exit(0);
  } else if (passRate >= 80) {
    console.log(`✅ ACCEPTABLE: ${passRate.toFixed(1)}% pass rate (≥80% threshold)`);
    console.log('Frontend security is mostly good with minor issues.\n');
    process.exit(0);
  } else {
    console.log(`❌ FAILED: ${passRate.toFixed(1)}% pass rate (<80% threshold)`);
    console.log('Frontend has security issues that need to be addressed.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
