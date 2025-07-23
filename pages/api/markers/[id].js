const jwt = require('jsonwebtoken');
const { parse } = require('cookie');
const db = require('../../../lib/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure API route to handle larger payloads (for consistency)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
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
  const { id } = req.query;

  try {

    if (req.method === 'DELETE') {
      // Delete marker - only for admin users
      const user = verifyAuth(req);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Check if marker exists
      const checkResult = await db.query(
        'SELECT id FROM markers WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Marker not found' });
      }

      // Delete the marker
      await db.query('DELETE FROM markers WHERE id = $1', [id]);

      return res.status(200).json({ 
        message: 'Marker deleted successfully',
        deletedId: parseInt(id)
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Delete marker API error:', error);
    
    // Handle specific database errors
    if (error.message === 'Database connection unavailable') {
      return res.status(503).json({ 
        message: 'Database service temporarily unavailable',
        error: 'DATABASE_UNAVAILABLE' 
      });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 