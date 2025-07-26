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
  console.log('markers-list function called', { method: event.httpMethod });

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
    // GET /api/markers - Get all markers
    if (method === 'GET') {
      const markersResult = await pool.query(`
        SELECT 
          id, 
          title, 
          description, 
          latitude, 
          longitude, 
          icon_image, 
          google_maps_url, 
          content_items, 
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
        googleMapsUrl: row.google_maps_url || '',
        contentItems: row.content_items || [],
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
      const user = verifyToken(event.headers.cookie);
      
      if (!user || user.role !== 'admin') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ message: 'Admin access required' })
        };
      }

      const {
        position,
        title,
        description,
        iconImage,
        contentItems = [],
        googleMapsUrl = ''
      } = JSON.parse(event.body);

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

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Marker created successfully',
          marker: responseMarker
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Markers function error:', error);
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
