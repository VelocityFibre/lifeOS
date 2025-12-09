/**
 * Database Setup Script
 * Run this to create tables in Neon PostgreSQL
 *
 * Usage:
 *   npm run db:setup
 *   or
 *   tsx scripts/setup-db.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../src/db';

async function setupDatabase() {
  console.log('\n🚀 Starting database setup...\n');

  try {
    // Test connection first
    console.log('📡 Testing database connection...');
    const connected = await db.testConnection();

    if (!connected) {
      console.error('❌ Could not connect to database');
      process.exit(1);
    }

    // Read schema file
    console.log('\n📄 Reading schema.sql...');
    const schemaPath = join(__dirname, '..', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('⚙️  Executing schema...');
    await db.query(schema);

    console.log('✅ Schema executed successfully');

    // Verify tables were created
    console.log('\n📊 Verifying tables...');
    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n✅ Tables created:');
    tablesResult.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check schema version
    const versionResult = await db.query(
      'SELECT version, description, applied_at FROM schema_version ORDER BY version DESC LIMIT 1'
    );

    if (versionResult.rows.length > 0) {
      const latest = versionResult.rows[0];
      console.log(`\n📌 Schema version: ${latest.version}`);
      console.log(`   ${latest.description}`);
      console.log(`   Applied: ${new Date(latest.applied_at).toLocaleString()}`);
    }

    console.log('\n🎉 Database setup complete!\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// Run setup
setupDatabase();
