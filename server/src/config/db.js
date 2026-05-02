const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

/**
 * Execute a raw SQL query with parameterized values.
 * Returns results in native snake_case.
 */
const query = async (text, params) => {
  return pool.query(text, params);
};

/**
 * Get a client from the pool for transactions.
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
