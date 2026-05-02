/**
 * Database initializer — runs the SQL init script against the database.
 * Usage: node src/config/initDb.js
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function initDb() {
  try {
    const sqlPath = path.join(__dirname, '../../sql/001_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  } finally {
    await pool.end();
  }
}

initDb();
