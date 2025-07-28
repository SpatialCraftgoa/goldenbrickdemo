const express = require('express');
const router = express.Router();

// Import the converted Netlify functions as Express middleware
const authRoutes = require('./auth');
const markerRoutes = require('./markers');

// Route mapping for Netlify Functions compatibility
// This allows your frontend to continue using /.netlify/functions/ URLs

// Auth routes
router.use('/auth-login', authRoutes);
router.use('/auth-logout', authRoutes);
router.use('/auth-me', authRoutes);

// Marker routes
router.use('/markers-list', markerRoutes);
router.use('/markers-icons', (req, res) => {
  // Return available marker icons
  res.json({
    icons: [
      { name: 'default', url: '/static/images/markers/embedded.svg' },
      { name: 'restaurant', url: '/static/images/markers/embedded_1.svg' },
      { name: 'hotel', url: '/static/images/markers/embedded_2.svg' },
      { name: 'attraction', url: '/static/images/markers/embedded_3.svg' },
      { name: 'shopping', url: '/static/images/markers/embedded_4.svg' }
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Netlify Functions Compatibility Layer'
  });
});

module.exports = router;
