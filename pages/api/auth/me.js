const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const db = require('../../../lib/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['auth-token'];

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data from database
    const result = await db.query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    console.error('Auth check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 