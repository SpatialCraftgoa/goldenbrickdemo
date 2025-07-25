const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addCategoryColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Add category column to markers table
    await client.query(`
      ALTER TABLE markers 
      ADD COLUMN IF NOT EXISTS category INTEGER DEFAULT NULL
    `);
    console.log('✅ Category column added to markers table');

    // Fix google_maps_link to google_maps_url for consistency
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'markers' 
      AND column_name = 'google_maps_link'
    `);

    if (columnExists.rows.length > 0) {
      await client.query(`
        ALTER TABLE markers 
        RENAME COLUMN google_maps_link TO google_maps_url
      `);
      console.log('✅ Renamed google_maps_link to google_maps_url for consistency');
    } else {
      console.log('ℹ️  google_maps_url column already exists or google_maps_link not found');
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
addCategoryColumn().catch(console.error); 