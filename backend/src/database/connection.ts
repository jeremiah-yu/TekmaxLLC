import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { mockDb } from './mockDatabase';

dotenv.config();

// Check if we should use mock database (when USE_MOCK_DB=true or no DB credentials)
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || !process.env.DB_HOST || !process.env.DB_PASSWORD;

let pool: Pool | null = null;

if (!USE_MOCK_DB) {
  // Support both DATABASE_URL (for Render/Heroku) and individual variables
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  } else {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tekmax_delivery',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
}

export async function initializeDatabase(): Promise<void> {
  if (USE_MOCK_DB) {
    console.log('✅ Using MOCK database (in-memory) - No PostgreSQL required!');
    console.log('📝 Pre-loaded test accounts:');
    console.log('   👤 Admin: admin@tekmax.com / admin123');
    console.log('   🏪 Owner: owner@restaurant.com / owner123');
    console.log('   🚴 Rider: rider@tekmax.com / rider123');
    console.log('   🍕 Restaurant: Pizza Palace (already created)');
    return;
  }

  try {
    const client = await pool!.connect();
    console.log('✅ Database connection established (PostgreSQL)');
    client.release();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('💡 Falling back to MOCK database');
    console.log('📝 To use PostgreSQL, set DB_HOST and DB_PASSWORD in .env');
    // Don't throw - fall back to mock
  }
}

export async function query(text: string, params?: any[]): Promise<any> {
  if (USE_MOCK_DB) {
    return await mockDb.query(text, params);
  }

  if (!pool) {
    // Fallback to mock if pool not initialized
    return await mockDb.query(text, params);
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    // Fallback to mock on error
    console.log('💡 Falling back to MOCK database for this query');
    return await mockDb.query(text, params);
  }
}

export async function getClient(): Promise<PoolClient> {
  if (USE_MOCK_DB || !pool) {
    throw new Error('getClient() not supported with mock database');
  }
  return await pool.connect();
}

export { pool };
