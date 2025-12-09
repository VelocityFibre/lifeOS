/**
 * Database Connection Module
 * Neon PostgreSQL with connection pooling
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('💡 Please add your Neon connection string to .env file');
  process.exit(1);
}

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Neon requires SSL
  },
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10 seconds - Neon can be slow to connect
});

// Log pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

/**
 * Execute a query with parameters
 */
export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 1s)
    if (duration > 1000) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    console.log('✅ Database connected:', result.rows[0].now);
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(',')[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✅ Database pool closed');
}

// Export pool for advanced use cases
export { pool };

export default {
  query,
  getClient,
  testConnection,
  closePool,
  pool,
};
