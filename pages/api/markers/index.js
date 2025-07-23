const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const db = require('../../../lib/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure API route to handle larger payloads (for base64 images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase size limit to 10MB for base64 images
    },
  },
}

// Helper function to verify authentication
function verifyAuth(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['auth-token'];
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Fetch all markers - accessible to all users (authenticated and non-authenticated)
      const result = await db.query(`
        SELECT id, title, description, latitude, longitude, 
               icon_image, content_items, created_by, created_at 
        FROM markers 
        ORDER BY created_at DESC
      `);

      const markers = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        position: {
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude)
        },
        iconImage: row.icon_image,
        contentItems: row.content_items,
        createdBy: row.created_by,
        createdAt: row.created_at
      }));

      return res.status(200).json({ markers });

    } else if (req.method === 'POST') {
      // Create new marker - only for admin users
      const user = verifyAuth(req);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { title, description, position, iconImage, contentItems } = req.body;

      if (!title || !description || !position || !iconImage || !contentItems) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const result = await db.query(`
        INSERT INTO markers (title, description, latitude, longitude, icon_image, content_items, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        title,
        description,
        position.lat,
        position.lng,
        iconImage,
        JSON.stringify(contentItems),
        user.username
      ]);

      const newMarker = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        position: {
          lat: parseFloat(result.rows[0].latitude),
          lng: parseFloat(result.rows[0].longitude)
        },
        iconImage: result.rows[0].icon_image,
        contentItems: result.rows[0].content_items,
        createdBy: result.rows[0].created_by,
        createdAt: result.rows[0].created_at
      };

      return res.status(201).json({ 
        message: 'Marker created successfully', 
        marker: newMarker 
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Markers API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 