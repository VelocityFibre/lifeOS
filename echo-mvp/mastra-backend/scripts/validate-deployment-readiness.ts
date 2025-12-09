/**
 * Deployment Readiness Validation Script
 * Checks if the backend is ready for database connection and deployment
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: path.join(__dirname, '..', '.env') });

interface ValidationResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: ValidationResult[] = [];

function checkFile(filePath: string, description: string): boolean {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  results.push({
    category: 'Files',
    check: description,
    status: exists ? 'pass' : 'fail',
    message: exists ? `✅ ${filePath} exists` : `❌ ${filePath} missing`,
  });
  return exists;
}

function checkEnvVar(varName: string, required: boolean = true): boolean {
  const value = process.env[varName];
  const exists = !!value;

  if (required) {
    results.push({
      category: 'Environment',
      check: varName,
      status: exists ? 'pass' : 'fail',
      message: exists ? `✅ ${varName} is set` : `❌ ${varName} is missing`,
    });
  } else {
    results.push({
      category: 'Environment',
      check: varName,
      status: exists ? 'pass' : 'warning',
      message: exists ? `✅ ${varName} is set` : `⚠️ ${varName} not set (optional)`,
    });
  }

  return exists;
}

function checkDependency(packageName: string): boolean {
  try {
    require.resolve(packageName);
    results.push({
      category: 'Dependencies',
      check: packageName,
      status: 'pass',
      message: `✅ ${packageName} installed`,
    });
    return true;
  } catch (e) {
    results.push({
      category: 'Dependencies',
      check: packageName,
      status: 'fail',
      message: `❌ ${packageName} not installed`,
    });
    return false;
  }
}

function checkCodeIntegration(filePath: string, pattern: string, description: string): boolean {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const found = content.includes(pattern);

    results.push({
      category: 'Code Integration',
      check: description,
      status: found ? 'pass' : 'warning',
      message: found
        ? `✅ ${description}`
        : `⚠️ ${description} - not found in ${filePath}`,
    });

    return found;
  } catch (e) {
    results.push({
      category: 'Code Integration',
      check: description,
      status: 'fail',
      message: `❌ Could not check ${filePath}`,
    });
    return false;
  }
}

async function runValidation() {
  console.log('\n🔍 LifeOS Deployment Readiness Validation');
  console.log('=========================================\n');

  // Load environment variables
  require('dotenv').config();

  // 1. Check Critical Files
  console.log('📁 Checking Critical Files...');
  checkFile('schema.sql', 'Database schema');
  checkFile('src/db/index.ts', 'Database connection module');
  checkFile('src/api/auth.ts', 'Authentication module');
  checkFile('src/api/server.ts', 'API server');
  checkFile('.env', 'Environment file');
  checkFile('.env.example', 'Environment example file');
  console.log('');

  // 2. Check Environment Variables
  console.log('🔐 Checking Environment Variables...');
  checkEnvVar('OPENAI_API_KEY', true);
  checkEnvVar('DATABASE_URL', true);
  checkEnvVar('JWT_SECRET', false);
  checkEnvVar('GOOGLE_CLIENT_ID', false);
  checkEnvVar('GOOGLE_CLIENT_SECRET', false);
  checkEnvVar('API_PORT', false);
  console.log('');

  // 3. Check Dependencies
  console.log('📦 Checking Dependencies...');
  checkDependency('pg');
  checkDependency('bcrypt');
  checkDependency('jsonwebtoken');
  checkDependency('express');
  checkDependency('cors');
  checkDependency('@mastra/core');
  console.log('');

  // 4. Check Code Integration
  console.log('🔗 Checking Code Integration...');
  checkCodeIntegration('src/api/server.ts', 'register, login, logout', 'Auth endpoints registered');
  checkCodeIntegration('src/api/server.ts', '/api/messages', 'Message endpoints registered');
  checkCodeIntegration('src/api/auth.ts', 'import { query }', 'Auth uses database');
  checkCodeIntegration('src/db/index.ts', 'process.env.DATABASE_URL', 'Database requires DATABASE_URL');
  console.log('');

  // 5. Print Summary
  console.log('📊 Validation Summary');
  console.log('=========================================\n');

  const categories = ['Files', 'Environment', 'Dependencies', 'Code Integration'];

  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'pass').length;
    const failed = categoryResults.filter(r => r.status === 'fail').length;
    const warnings = categoryResults.filter(r => r.status === 'warning').length;

    console.log(`${category}:`);
    console.log(`  ✅ Passed: ${passed}`);
    if (warnings > 0) console.log(`  ⚠️  Warnings: ${warnings}`);
    if (failed > 0) console.log(`  ❌ Failed: ${failed}`);
    console.log('');
  }

  // 6. Print Detailed Results
  console.log('📋 Detailed Results');
  console.log('=========================================\n');

  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    console.log(`${category}:`);
    categoryResults.forEach(r => {
      console.log(`  ${r.message}`);
    });
    console.log('');
  }

  // 7. Determine Overall Status
  const totalFailed = results.filter(r => r.status === 'fail').length;
  const criticalFailures = results.filter(r =>
    r.status === 'fail' &&
    (r.check === 'DATABASE_URL' || r.check === 'OPENAI_API_KEY')
  ).length;

  console.log('🎯 Overall Status');
  console.log('=========================================\n');

  if (totalFailed === 0) {
    console.log('✅ All checks passed! Ready for deployment.');
  } else if (criticalFailures > 0) {
    console.log('❌ Critical failures detected. Cannot deploy.');
    console.log('\n📝 Next Steps:');

    if (!process.env.DATABASE_URL) {
      console.log('  1. Set up Neon PostgreSQL database:');
      console.log('     - Visit https://neon.tech');
      console.log('     - Create a new project');
      console.log('     - Copy the connection string');
      console.log('     - Add to .env file: DATABASE_URL=postgresql://...');
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('  2. Configure OpenAI API key:');
      console.log('     - Visit https://platform.openai.com/api-keys');
      console.log('     - Create a new API key');
      console.log('     - Add to .env file: OPENAI_API_KEY=sk-...');
    }
  } else {
    console.log('⚠️  Some non-critical checks failed. Review warnings above.');
    console.log('    You may proceed with deployment, but some features may be limited.');
  }

  console.log('');

  // Exit code
  process.exit(criticalFailures > 0 ? 1 : 0);
}

// Run validation
runValidation().catch(error => {
  console.error('\n❌ Validation failed with error:', error);
  process.exit(1);
});
