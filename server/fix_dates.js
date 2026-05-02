const { pool } = require('./src/config/db');

async function fix() {
  try {
    const res = await pool.query("UPDATE attendance SET date = '2026-05-03' WHERE date = '2026-05-02'");
    console.log(`✅ Fixed ${res.rowCount} records`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fix();
