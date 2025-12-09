/**
 * Test Database Connection Script
 * Quick test to verify Neon connection is working
 *
 * Usage:
 *   npm run db:test
 *   or
 *   tsx scripts/test-db-connection.ts
 */

import db from '../src/db';

async function testConnection() {
  console.log('\n🔍 Testing Neon database connection...\n');

  try {
    // Test basic connection
    const connected = await db.testConnection();

    if (!connected) {
      console.error('\n❌ Connection test failed');
      process.exit(1);
    }

    // Check if tables exist
    console.log('\n📊 Checking for existing tables...');
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  No tables found. Run "npm run db:setup" to create schema.');
    } else {
      console.log(`✅ Found ${result.rows.length} tables:`);
      result.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // Test query performance
    console.log('\n⚡ Testing query performance...');
    const start = Date.now();
    await db.query('SELECT 1 as test');
    const duration = Date.now() - start;
    console.log(`✅ Query completed in ${duration}ms`);

    console.log('\n✅ All connection tests passed!\n');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// Run test
testConnection();
