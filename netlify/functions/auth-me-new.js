const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  console.log('auth-me function called', { method: event.httpMethod });

  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://spatial-craft-dubaidemo.netlify.app'
      : '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const method = event.httpMethod;

  try {
    // Get current user endpoint
    if (method === 'GET') {
      const cookies = event.headers.cookie || '';
      console.log('Cookies received:', cookies);
      
      const tokenMatch = cookies.match(/token=([^;]+)/);
      
      if (!tokenMatch) {
        console.log('No token found in cookies');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'No token provided' })
        };
      }

      console.log('Token found, verifying...');
      const decoded = jwt.verify(
        tokenMatch[1], 
        process.env.JWT_SECRET || 'fallback-secret-change-in-production'
      );
      
      console.log('Token decoded:', decoded);
      
      // Query database for user
      console.log('Querying database for user...');
      const userResult = await pool.query(
        'SELECT id, username, role FROM users WHERE id = $1',
        [decoded.id]
      );
      
      console.log('Database query result:', userResult.rows);
      
      if (userResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'User not found' })
        };
      }
      
      const user = userResult.rows[0];
      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Auth login function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      })
    };
  }
};
