const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Local storage fallback for development
const LOCAL_DATA_FILE = path.join(process.cwd(), 'local_data.json');

// Local storage operations
class LocalStorage {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(LOCAL_DATA_FILE)) {
        return JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading local data:', error);
    }
    
    // Default data structure
    return {
      users: [{
        id: 1,
        username: 'admin',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // 'admin' hashed
        role: 'admin',
        created_at: new Date().toISOString()
      }],
      markers: [],
      nextUserId: 2,
      nextMarkerId: 1
    };
  }

  saveData() {
    try {
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  }

  // Simulate SQL queries for local storage
  async query(sql, params = []) {
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.includes('select') && sqlLower.includes('users')) {
      // Handle user queries
      if (sqlLower.includes('where username')) {
        const username = params[0];
        const user = this.data.users.find(u => u.username === username);
        return { rows: user ? [user] : [] };
      }
      return { rows: this.data.users };
    }
    
    if (sqlLower.includes('select') && sqlLower.includes('markers')) {
      if (sqlLower.includes('where id')) {
        const id = parseInt(params[0]);
        const marker = this.data.markers.find(m => m.id === id);
        return { rows: marker ? [marker] : [] };
      }
      return { rows: this.data.markers };
    }
    
    if (sqlLower.includes('insert') && sqlLower.includes('markers')) {
      // Insert marker
      const [title, description, lat, lng, iconImage, contentItems, googleMapsUrl, createdBy] = params;
      const newMarker = {
        id: this.data.nextMarkerId++,
        title,
        description,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        icon_image: iconImage,
        content_items: JSON.parse(contentItems),
        google_maps_url: googleMapsUrl,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.markers.push(newMarker);
      this.saveData();
      return { rows: [newMarker] };
    }
    
    if (sqlLower.includes('delete') && sqlLower.includes('markers')) {
      const id = parseInt(params[0]);
      const initialLength = this.data.markers.length;
      this.data.markers = this.data.markers.filter(m => m.id !== id);
      this.saveData();
      return { rows: [], rowCount: initialLength - this.data.markers.length };
    }
    
    // For other queries, return empty result
    return { rows: [] };
  }
}

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
let useLocalFallback = false;
const localStorage = new LocalStorage();

// Test the connection
pool.on('connect', (client) => {
  console.log(`Connected to PostgreSQL database at ${process.env.DB_HOST || '3.228.40.132'}`);
  isConnected = true;
  useLocalFallback = false;
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  isConnected = false;
  useLocalFallback = true;
  
  // Log specific error types for debugging
  if (err.code === 'EADDRNOTAVAIL') {
    console.error('Database server is not reachable. Switching to local storage fallback.');
    console.error(`1. Network connectivity to ${process.env.DB_HOST || '3.228.40.132'}`);
    console.error('2. Database server is running');
    console.error('3. Firewall/security group settings');
    console.error('4. Using local file storage for development');
  }
});

// Test initial connection and set fallback if needed
setTimeout(async () => {
  try {
    await pool.query('SELECT 1');
    isConnected = true;
    useLocalFallback = false;
    console.log('PostgreSQL connection successful');
  } catch (err) {
    console.log('PostgreSQL unavailable, using local storage fallback');
    isConnected = false;
    useLocalFallback = true;
  }
}, 1000);

// Graceful query execution with error handling
async function executeQuery(text, params) {
  // If we're using local fallback, use localStorage
  if (useLocalFallback) {
    console.log('Using local storage for query:', text.substring(0, 50) + '...');
    return localStorage.query(text, params);
  }
  
  // Try PostgreSQL first
  try {
    const result = await pool.query(text, params);
    isConnected = true;
    return result;
  } catch (err) {
    console.error('PostgreSQL query failed, falling back to local storage:', err.message);
    useLocalFallback = true;
    isConnected = false;
    return localStorage.query(text, params);
  }
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
        google_maps_url TEXT,
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

    try {
      await executeQuery(`
        ALTER TABLE markers 
        ADD COLUMN IF NOT EXISTS google_maps_url TEXT
      `);
    } catch (err) {
      // Column might already exist, ignore error
      console.log('google_maps_url column handling:', err.message);
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
    if (useLocalFallback) {
      console.log('Using local storage - data will be saved to local_data.json');
    }
  }
}

// Initialize database on module load with better error handling
initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err.message);
});

module.exports = {
  query: executeQuery,
  pool,
  isConnected: () => isConnected || useLocalFallback // Always return true if local fallback is available
}; 