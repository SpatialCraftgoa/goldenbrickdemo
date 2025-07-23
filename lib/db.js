const { Pool } = require('pg');

// PostgreSQL connection configuration using environment variables
const pool = new Pool({
  host: process.env.DB_HOST || '3.228.40.132',
  database: process.env.DB_NAME || 'live',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: false, // Set to true if SSL is required
  connectionTimeoutMillis: 10000, // Increased from 5000
  idleTimeoutMillis: 30000,
  max: 20,
  // Add retry configuration
  retry: {
    max: 3,
    delay: 2000
  }
});

// Connection pool health check
let isConnected = false;

// Test the connection
pool.on('connect', (client) => {
  console.log(`Connected to PostgreSQL database at ${process.env.DB_HOST || '3.228.40.132'}`);
  isConnected = true;
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  isConnected = false;
  
  // Log specific error types for debugging
  if (err.code === 'EADDRNOTAVAIL') {
    console.error('Database server is not reachable. Please check:');
    console.error(`1. Network connectivity to ${process.env.DB_HOST || '3.228.40.132'}`);
    console.error('2. Database server is running');
    console.error('3. Firewall/security group settings');
    console.error('4. Consider switching to a local database for development');
  }
});

// Graceful query execution with error handling
async function executeQuery(text, params) {
  if (!isConnected) {
    try {
      // Test connection before executing query
      await pool.query('SELECT 1');
      isConnected = true;
    } catch (err) {
      console.error('Database not available:', err.message);
      throw new Error('Database connection unavailable');
    }
  }
  
  return pool.query(text, params);
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create markers table with all required columns
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS markers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        icon_image TEXT NOT NULL,
        content_items JSONB NOT NULL,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing markers table if they don't exist
    try {
      await executeQuery(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)
      `);
    } catch (err) {
      // Column might already exist, ignore error
      console.log('created_by column handling:', err.message);
    }

    try {
      await executeQuery(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
    } catch (err) {
      // Column might already exist, ignore error
      console.log('updated_at column handling:', err.message);
    }

    // Insert default admin user if not exists
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    await executeQuery(`
      INSERT INTO users (username, password, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedPassword, 'admin']);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Application will continue without database functionality');
  }
}

// Initialize database on module load with better error handling
initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err.message);
});

module.exports = {
  query: executeQuery,
  pool,
  isConnected: () => isConnected
}; 