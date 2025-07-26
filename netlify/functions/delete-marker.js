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

// Helper function to verify JWT token
const verifyToken = (cookies) => {
  if (!cookies) return null;
  
  const tokenMatch = cookies.match(/token=([^;]+)/);
  if (!tokenMatch) return null;

  try {
    return jwt.verify(
      tokenMatch[1], 
      process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    );
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  console.log('delete-marker function called', { method: event.httpMethod });

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
  console.log('Processing method:', method);

  try {
    // DELETE /api/markers/{id} - Delete marker (admin only)
    if (method === 'DELETE') {
      console.log('Processing DELETE request for marker');
      
      const user = verifyToken(event.headers.cookie);
      console.log('User from token:', user);
      
      if (!user || user.role !== 'admin') {
        console.log('Access denied - not admin or no valid token');
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ message: 'Admin access required' })
        };
      }

      // Extract marker ID from path or query parameters
      let markerId;
      if (event.pathParameters && event.pathParameters.id) {
        markerId = event.pathParameters.id;
      } else if (event.queryStringParameters && event.queryStringParameters.id) {
        markerId = event.queryStringParameters.id;
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Marker ID is required' })
        };
      }

      console.log('Deleting marker ID:', markerId);

      // Check if marker exists
      const existingMarker = await pool.query('SELECT id FROM markers WHERE id = $1', [markerId]);
      if (existingMarker.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Marker not found' })
        };
      }

      // Delete the marker
      await pool.query('DELETE FROM markers WHERE id = $1', [markerId]);

      console.log('Marker deleted successfully:', markerId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Marker deleted successfully',
          deletedId: parseInt(markerId)
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed for this endpoint - use DELETE' })
    };

  } catch (error) {
    console.error('Delete marker function error:', error);
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
