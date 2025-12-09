/**
 * Database Connection Diagnostic Tool
 * Provides detailed troubleshooting for database connection issues
 */

import * as pg from 'pg';

const TIMEOUT_MS = 10000; // 10 second timeout

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'info';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function addResult(test: string, status: 'pass' | 'fail' | 'info', message: string, details?: any) {
  results.push({ test, status, message, details });
}

function parseConnectionString(dbUrl: string) {
  try {
    const url = new URL(dbUrl);
    return {
      protocol: url.protocol,
      username: url.username,
      password: url.password ? '***' : undefined,
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      searchParams: Object.fromEntries(url.searchParams),
    };
  } catch (e) {
    return null;
  }
}

async function testBasicConnection(dbUrl: string): Promise<boolean> {
  const client = new pg.Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: TIMEOUT_MS,
  });

  try {
    await client.connect();
    addResult('Basic Connection', 'pass', 'Successfully connected to database');
    await client.end();
    return true;
  } catch (error: any) {
    addResult('Basic Connection', 'fail', 'Failed to connect to database', {
      error: error.message,
      code: error.code,
    });
    return false;
  }
}

async function testQuery(dbUrl: string): Promise<boolean> {
  const client = new pg.Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: TIMEOUT_MS,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as current_time');
    addResult('Query Execution', 'pass', 'Successfully executed query', {
      currentTime: result.rows[0].current_time,
    });
    await client.end();
    return true;
  } catch (error: any) {
    addResult('Query Execution', 'fail', 'Failed to execute query', {
      error: error.message,
    });
    return false;
  }
}

async function testSchemaCheck(dbUrl: string): Promise<boolean> {
  const client = new pg.Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: TIMEOUT_MS,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = result.rows.map(r => r.table_name);
    const expectedTables = ['users', 'messages', 'agent_state', 'sessions', 'oauth_tokens'];
    const missingTables = expectedTables.filter(t => !tables.includes(t));

    if (missingTables.length === 0) {
      addResult('Schema Check', 'pass', 'All required tables exist', { tables });
    } else {
      addResult('Schema Check', 'fail', 'Some required tables are missing', {
        existingTables: tables,
        missingTables,
      });
    }

    await client.end();
    return missingTables.length === 0;
  } catch (error: any) {
    addResult('Schema Check', 'fail', 'Failed to check schema', {
      error: error.message,
    });
    return false;
  }
}

async function testPoolConnection(dbUrl: string): Promise<boolean> {
  const pool = new pg.Pool({
    connectionString: dbUrl,
    max: 5,
    connectionTimeoutMillis: TIMEOUT_MS,
  });

  try {
    const client = await pool.connect();
    addResult('Connection Pool', 'pass', 'Successfully acquired connection from pool');
    client.release();
    await pool.end();
    return true;
  } catch (error: any) {
    addResult('Connection Pool', 'fail', 'Failed to acquire connection from pool', {
      error: error.message,
    });
    await pool.end();
    return false;
  }
}

async function runDiagnostics() {
  console.log('\n🔍 Database Connection Diagnostics');
  console.log('=====================================\n');

  // Load environment
  require('dotenv').config();

  const dbUrl = process.env.DATABASE_URL;

  // 1. Check if DATABASE_URL is set
  if (!dbUrl) {
    console.log('❌ DATABASE_URL is not set in environment');
    console.log('\n💡 Next Steps:');
    console.log('  1. Create a Neon PostgreSQL account at https://neon.tech');
    console.log('  2. Create a new project');
    console.log('  3. Copy the connection string');
    console.log('  4. Add to .env file:\n');
    console.log('     DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require\n');
    process.exit(1);
  }

  addResult('Environment', 'pass', 'DATABASE_URL is configured');

  // 2. Parse connection string
  const parsed = parseConnectionString(dbUrl);
  if (parsed) {
    addResult('Connection String', 'pass', 'Connection string is valid', parsed);
  } else {
    addResult('Connection String', 'fail', 'Connection string is invalid');
    printResults();
    process.exit(1);
  }

  // 3. Test basic connection
  console.log('⏳ Testing basic connection...');
  const basicConnected = await testBasicConnection(dbUrl);

  if (!basicConnected) {
    console.log('\n⚠️  Basic connection failed. Common causes:');
    console.log('  • Firewall blocking outbound connections on port 5432');
    console.log('  • Neon database is paused (free tier auto-pauses)');
    console.log('  • Invalid connection credentials');
    console.log('  • Network connectivity issues\n');
    console.log('💡 Troubleshooting:');
    console.log('  1. Visit Neon dashboard and ensure database is active');
    console.log('  2. Try accessing database from another location');
    console.log('  3. Check if you can ping the host:');
    console.log(`     ping ${parsed?.host}`);
    console.log('  4. Verify connection string is correct in .env file\n');
    printResults();
    process.exit(1);
  }

  // 4. Test query execution
  console.log('⏳ Testing query execution...');
  await testQuery(dbUrl);

  // 5. Test schema
  console.log('⏳ Checking database schema...');
  const schemaExists = await testSchemaCheck(dbUrl);

  if (!schemaExists) {
    console.log('\n⚠️  Database schema is incomplete or missing.');
    console.log('💡 Run the setup script to create tables:\n');
    console.log('     npm run db:setup\n');
  }

  // 6. Test connection pool
  console.log('⏳ Testing connection pool...');
  await testPoolConnection(dbUrl);

  // Print results
  printResults();

  // Exit code
  const failures = results.filter(r => r.status === 'fail').length;
  process.exit(failures > 0 ? 1 : 0);
}

function printResults() {
  console.log('\n📊 Diagnostic Results');
  console.log('=====================================\n');

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : 'ℹ️';
    console.log(`${icon} ${result.test}: ${result.message}`);

    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => '   ' + l).join('\n').trim());
    }
    console.log('');
  }

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`Summary: ${passed} passed, ${failed} failed\n`);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n❌ Diagnostic failed with error:', error);
  process.exit(1);
});
