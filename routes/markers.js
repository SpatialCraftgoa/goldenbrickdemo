const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// GET /api/markers - Get all markers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        latitude,
        longitude,
        icon_image,
        google_maps_link,
        content_items,
        created_by,
        created_at
      FROM markers 
      ORDER BY created_at DESC
    `);

    const markers = result.rows.map(marker => ({
      id: marker.id,
      title: marker.title,
      description: marker.description,
      position: {
        lat: parseFloat(marker.latitude),
        lng: parseFloat(marker.longitude)
      },
      iconImage: marker.icon_image,
      googleMapsUrl: marker.google_maps_link,
      contentItems: marker.content_items || [],
      createdBy: marker.created_by,
      createdAt: marker.created_at
    }));

    res.json({ markers });
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/markers - Create new marker (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      position,
      title,
      description,
      iconImage,
      contentItems = [],
      googleMapsUrl = ''
    } = req.body;

    if (!position || !title || !description || !iconImage) {
      return res.status(400).json({ 
        message: 'Position, title, description, and icon image are required' 
      });
    }

    if (!position.lat || !position.lng) {
      return res.status(400).json({ 
        message: 'Valid latitude and longitude are required' 
      });
    }

    const result = await pool.query(`
      INSERT INTO markers (
        title, 
        description, 
        latitude, 
        longitude, 
        icon_image,
        google_maps_link,
        content_items, 
        created_by
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `, [
      title,
      description,
      position.lat,
      position.lng,
      iconImage,
      googleMapsUrl,
      JSON.stringify(contentItems),
      req.user.username
    ]);

    const newMarker = result.rows[0];
    
    const responseMarker = {
      id: newMarker.id,
      title: newMarker.title,
      description: newMarker.description,
      position: {
        lat: parseFloat(newMarker.latitude),
        lng: parseFloat(newMarker.longitude)
      },
      iconImage: newMarker.icon_image,
      googleMapsUrl: newMarker.google_maps_link,
      contentItems: newMarker.content_items || [],
      createdBy: newMarker.created_by,
      createdAt: newMarker.created_at
    };

    res.status(201).json({ 
      message: 'Marker created successfully',
      marker: responseMarker
    });
  } catch (error) {
    console.error('Error creating marker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/markers/:id - Delete marker (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const markerId = parseInt(req.params.id);

    if (isNaN(markerId)) {
      return res.status(400).json({ message: 'Invalid marker ID' });
    }

    const result = await pool.query(
      'DELETE FROM markers WHERE id = $1 RETURNING id',
      [markerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Marker not found' });
    }

    res.json({ 
      message: 'Marker deleted successfully',
      deletedId: markerId
    });
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/markers/:id - Get single marker
router.get('/:id', async (req, res) => {
  try {
    const markerId = parseInt(req.params.id);

    if (isNaN(markerId)) {
      return res.status(400).json({ message: 'Invalid marker ID' });
    }

    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        latitude,
        longitude,
        icon_image,
        google_maps_link,
        content_items,
        created_by,
        created_at
      FROM markers 
      WHERE id = $1
    `, [markerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Marker not found' });
    }

    const marker = result.rows[0];
    const responseMarker = {
      id: marker.id,
      title: marker.title,
      description: marker.description,
      position: {
        lat: parseFloat(marker.latitude),
        lng: parseFloat(marker.longitude)
      },
      iconImage: marker.icon_image,
      googleMapsUrl: marker.google_maps_link,
      contentItems: marker.content_items || [],
      createdBy: marker.created_by,
      createdAt: marker.created_at
    };

    res.json({ marker: responseMarker });
  } catch (error) {
    console.error('Error fetching marker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 