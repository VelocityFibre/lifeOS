/**
 * Add OAuth Tokens Table
 * Quick script to add the missing oauth_tokens table
 */

import { query, testConnection, closePool } from '../src/db';

async function addOAuthTable() {
  console.log('\n🔧 Adding OAuth Tokens Table...\n');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Could not connect to database');
      process.exit(1);
    }

    // Create oauth_tokens table
    console.log('\n📝 Creating oauth_tokens table...');
    await query(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_type VARCHAR(50) DEFAULT 'Bearer',
        expires_at TIMESTAMPTZ,
        scope TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, provider)
      )
    `);
    console.log('✅ Table oauth_tokens created');

    // Create index
    console.log('📝 Creating index...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_user_provider
      ON oauth_tokens(user_id, provider)
    `);
    console.log('✅ Index idx_oauth_user_provider created');

    // Create trigger
    console.log('📝 Creating updated_at trigger...');
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens
    `);

    await query(`
      CREATE TRIGGER update_oauth_tokens_updated_at
      BEFORE UPDATE ON oauth_tokens
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Trigger created');

    // Verify table exists
    console.log('\n📊 Verifying table...');
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'oauth_tokens'
    `);

    if (result.rows.length > 0) {
      console.log('✅ oauth_tokens table verified successfully!');
    } else {
      console.error('❌ Table creation failed');
      process.exit(1);
    }

    console.log('\n✅ OAuth table setup complete!\n');

    await closePool();
  } catch (error) {
    console.error('❌ Error adding OAuth table:', error);
    await closePool();
    process.exit(1);
  }
}

addOAuthTable();
