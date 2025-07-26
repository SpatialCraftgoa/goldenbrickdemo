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
  console.log('simplified markers function called', { method: event.httpMethod });

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
