const bcrypt = require('bcryptjs');
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
  console.log('auth-login function called', { method: event.httpMethod });

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
    // Login endpoint
    if (method === 'POST') {
      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Username and password are required' })
        };
      }

            // Find user in database
      const userResult = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const user = userResult.rows[0];
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
        },
        body: JSON.stringify({
          message: 'Login successful',
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
