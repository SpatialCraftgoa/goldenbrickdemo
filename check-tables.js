require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Available tables:', tablesResult.rows.map(r => r.table_name));
    
    // Check if markers table exists and its structure
    const markersStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'markers'
    `);
    
    console.log('Markers table structure:', markersStructure.rows);
    
    // Check if there are any rows
    if (markersStructure.rows.length > 0) {
      const count = await pool.query('SELECT COUNT(*) as count FROM markers');
      console.log('Number of markers:', count.rows[0].count);
      
      if (parseInt(count.rows[0].count) > 0) {
        const sample = await pool.query('SELECT * FROM markers LIMIT 1');
        console.log('Sample marker:', sample.rows[0]);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error.message);
    process.exit(1);
  }
}

checkTables();
