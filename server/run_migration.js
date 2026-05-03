const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'sql/002_notifications.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Migration 002 ran successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
