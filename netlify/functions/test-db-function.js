// Load environment variables in development
try { require('dotenv').config(); } catch (e) {}

const { Pool } = require('pg');

exports.handler = async (event, context) => {
  console.log('DB test function called');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  
  try {
    console.log('Environment variables:', {
      DB_HOST: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PORT: process.env.DB_PORT
    });
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database connection successful!',
        currentTime: result.rows[0].current_time,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Database test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
