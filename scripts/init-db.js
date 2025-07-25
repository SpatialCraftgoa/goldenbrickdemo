const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created or already exists');

    // Create markers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS markers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        icon_image TEXT NOT NULL,
        google_maps_link TEXT,
        content_items JSONB DEFAULT '[]'::jsonb,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Markers table created or already exists');

    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (adminCheck.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin', 12);
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created (username: admin, password: admin)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if sample markers exist
    const markerCheck = await client.query('SELECT COUNT(*) FROM markers');
    const markerCount = parseInt(markerCheck.rows[0].count);

    if (markerCount === 0) {
      console.log('📍 Adding sample markers for Dubai...');
      
      const sampleMarkers = [
        {
          title: 'Burj Khalifa',
          description: 'The world\'s tallest building and iconic landmark of Dubai',
          latitude: 25.1972,
          longitude: 55.2744,
          icon_image: '/static/images/GB_Logo_New-removebg-preview.png',
          google_maps_link: 'https://maps.google.com/maps?q=25.1972,55.2744',
          content_items: [
            {
              type: 'image',
              url: 'https://upload.wikimedia.org/wikipedia/en/9/93/Burj_Khalifa.jpg'
            },
            {
              type: 'video',
              url: 'https://www.youtube.com/watch?v=mZ7ENQR9J8k'
            }
          ]
        },
        {
          title: 'Dubai Mall',
          description: 'One of the world\'s largest shopping malls with over 1,200 shops',
          latitude: 25.1975,
          longitude: 55.2796,
          icon_image: '/static/images/GB_Logo_New-removebg-preview.png',
          google_maps_link: 'https://maps.google.com/maps?q=25.1975,55.2796',
          content_items: [
            {
              type: 'image',
              url: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/33/fc/f0/dubai-mall.jpg'
            }
          ]
        },
        {
          title: 'Palm Jumeirah',
          description: 'Artificial archipelago in the shape of a palm tree',
          latitude: 25.1124,
          longitude: 55.1390,
          icon_image: '/static/images/GB_Logo_New-removebg-preview.png',
          google_maps_link: 'https://maps.google.com/maps?q=25.1124,55.1390',
          content_items: [
            {
              type: 'image',
              url: 'https://cdn.britannica.com/16/155516-050-7A11D0D6/Palm-Jumeirah-Dubai-United-Arab-Emirates.jpg'
            }
          ]
        }
      ];

      for (const marker of sampleMarkers) {
        await client.query(`
          INSERT INTO markers (
            title, description, latitude, longitude, 
            icon_image, google_maps_link, content_items, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          marker.title,
          marker.description,
          marker.latitude,
          marker.longitude,
          marker.icon_image,
          marker.google_maps_link,
          JSON.stringify(marker.content_items),
          'admin'
        ]);
      }
      
      console.log('✅ Sample markers added successfully');
    } else {
      console.log(`ℹ️  Database already contains ${markerCount} markers`);
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Database: Connected ✅');
    console.log('   • Tables: Created ✅');
    console.log('   • Admin User: Ready ✅');
    console.log('   • Sample Data: Loaded ✅');
    console.log('\n🔐 Login Credentials:');
    console.log('   • Username: admin');
    console.log('   • Password: admin');
    console.log('\n🚀 Start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
initializeDatabase().catch(console.error); 