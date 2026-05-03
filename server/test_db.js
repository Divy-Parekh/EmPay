const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://empay:empay123@localhost:5432/empay_db',
});

async function test() {
  try {
    const res = await pool.query('SELECT login_id, role FROM users');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
