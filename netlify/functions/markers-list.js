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
  console.log('FINAL markers-list function called', { method: event.httpMethod });

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
  console.log('FINAL Processing method:', method);

  try {
    // GET /api/markers - Get all markers
    if (method === 'GET') {
      console.log('FINAL Processing GET request');
      const markersResult = await pool.query(`
        SELECT 
          id, 
          title, 
          description, 
          latitude, 
          longitude, 
          icon_image, 
          created_by, 
          created_at 
        FROM markers 
        ORDER BY created_at DESC
      `);

      const markers = markersResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        position: { lat: parseFloat(row.latitude), lng: parseFloat(row.longitude) },
        iconImage: row.icon_image,
        createdBy: row.created_by,
        createdAt: row.created_at
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ markers })
      };
    }

    // POST /api/markers - Create new marker (admin only)
    if (method === 'POST') {
      console.log('FINAL Processing POST request for new marker');
      
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

      const requestBody = JSON.parse(event.body);
      console.log('Request body:', requestBody);
      
      const {
        position,
        title,
        description,
        iconImage,
        contentItems = [],
        googleMapsUrl = ''
      } = requestBody;

      if (!position || !title || !description || !iconImage) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            message: 'Position, title, description, and icon image are required' 
          })
        };
      }

      // Insert into database
      const insertResult = await pool.query(`
        INSERT INTO markers (title, description, latitude, longitude, icon_image, google_maps_url, content_items, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        title,
        description,
        position.lat,
        position.lng,
        iconImage,
        googleMapsUrl || '',
        JSON.stringify(contentItems),
        user.username,
        new Date().toISOString()
      ]);

      const createdMarker = insertResult.rows[0];
      const responseMarker = {
        id: createdMarker.id,
        title: createdMarker.title,
        description: createdMarker.description,
        position: { lat: parseFloat(createdMarker.latitude), lng: parseFloat(createdMarker.longitude) },
        iconImage: createdMarker.icon_image,
        googleMapsUrl: createdMarker.google_maps_url || '',
        contentItems: createdMarker.content_items || [],
        createdBy: createdMarker.created_by,
        createdAt: createdMarker.created_at
      };

      console.log('Marker created successfully:', responseMarker.id);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Marker created successfully',
          marker: responseMarker
        })
      };
    }

    // DELETE /api/markers?id={id} - Delete marker (admin only)
    if (method === 'DELETE') {
      console.log('FINAL Processing DELETE request for marker');
      
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

      // Extract marker ID from query parameters
      let markerId;
      if (event.queryStringParameters && event.queryStringParameters.id) {
        markerId = event.queryStringParameters.id;
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Marker ID is required as query parameter (?id=123)' })
        };
      }

      console.log('FINAL Deleting marker ID:', markerId);

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

      console.log('FINAL Marker deleted successfully:', markerId);
      
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
      body: JSON.stringify({ message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('FINAL Markers function error:', error);
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
