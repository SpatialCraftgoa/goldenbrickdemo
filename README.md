# 🗺️ Dubai Interactive Map - Node.js Edition

A full-featured interactive map application for Dubai built with **Node.js**, **Express**, and **Leaflet**. This application allows users to view and interact with location markers on a map, with admin capabilities for adding and managing content.

## ✨ Features

### 🔍 **For All Users:**
- Interactive OpenStreetMap of Dubai
- View circular plot markers with rich content
- Click on markers to see detailed information
- Image slider for multiple photos
- Embedded YouTube videos
- Google Maps integration links
- Responsive design for mobile and desktop

### 👑 **For Admin Users:**
- Login with secure authentication
- Add new plot markers by clicking on the map
- Upload custom marker icons (automatically made circular)
- Add multiple images and YouTube videos to markers
- Include Google Maps links for navigation
- Delete existing markers
- Real-time updates without page refresh

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database access
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd dubaimap
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=3.228.40.132
   DB_NAME=live
   DB_USER=postgres
   DB_PASSWORD=123
   DB_PORT=5432

   # JWT Secret Key
   JWT_SECRET=your-super-secret-jwt-key-for-production-change-this

   # Node Environment
   NODE_ENV=development

   # Server Port
   PORT=3000
   ```

4. **Initialize the database:**
   ```bash
   npm run init-db
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   Open your browser to `http://localhost:3000`

## 🔐 **Login Credentials**

**Admin Access:**
- Username: `admin`
- Password: `admin`

## 📋 **API Endpoints**

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user info

### Markers/Plots
- `GET /api/markers` - Get all markers
- `POST /api/markers` - Create new marker (admin only)
- `GET /api/markers/:id` - Get single marker
- `DELETE /api/markers/:id` - Delete marker (admin only)

### Utility
- `GET /health` - Server health check
- `GET /` - Main application page

## 🛠️ **Technology Stack**

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Leaflet** - Interactive maps
- **HTML5/CSS3** - Modern web standards
- **OpenStreetMap** - Map tiles

### Security Features
- JWT-based authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Helmet.js security headers
- CORS protection
- Input validation and sanitization

## 📁 **Project Structure**

```
dubaimap/
├── server.js                 # Main Express server
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── routes/
│   ├── auth.js             # Authentication routes
│   └── markers.js          # Marker/plot routes
├── scripts/
│   └── init-db.js          # Database initialization
├── public/
│   ├── index.html          # Main HTML page
│   └── static/
│       ├── css/
│       │   └── style.css   # Application styles
│       ├── js/
│       │   └── main.js     # Frontend JavaScript
│       └── images/
│           └── *.png       # Static images
├── uploads/                # User uploaded files
└── README.md              # This file
```

## 🔧 **Available Scripts**

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database tables and sample data

## 🌍 **Environment Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_NAME` | Database name | dubaimap |
| `DB_USER` | Database username | postgres |
| `DB_PASSWORD` | Database password | - |
| `DB_PORT` | Database port | 5432 |
| `JWT_SECRET` | JWT signing secret | - |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |

## 📊 **Database Schema**

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Markers Table
```sql
CREATE TABLE markers (
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
);
```

## 🎯 **Key Features Implementation**

### Circular Marker Icons
All marker icons are automatically converted to circular format with:
- 40x40px size
- White border
- Drop shadow
- Responsive hover effects

### Media Slider
- Simple, lightweight image and video carousel
- Navigation arrows and dot indicators
- YouTube video embedding
- Responsive design

### Real-time Updates
- Immediate UI updates after adding/deleting markers
- No page refresh required
- Optimistic UI updates with error handling

### Security
- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt (12 rounds)
- Admin role-based access control
- Input validation and sanitization

## 🔄 **Migration from Next.js**

This application was successfully converted from Next.js to pure Node.js/Express:

### What Changed:
- ✅ React components → Vanilla JavaScript
- ✅ Next.js API routes → Express routes
- ✅ SSR → Client-side rendering
- ✅ Next.js config → Express middleware
- ✅ Static file serving → Express static

### What Stayed:
- ✅ All functionality preserved
- ✅ Database schema unchanged
- ✅ Authentication system intact
- ✅ UI/UX design consistent
- ✅ Admin capabilities maintained

## 🐛 **Troubleshooting**

### Common Issues:

1. **Static files not loading (404 errors):**
   - Ensure the server is properly serving static files
   - Check file paths in `public/static/` directory

2. **Database connection errors:**
   - Verify `.env` file configuration
   - Ensure PostgreSQL server is running
   - Check network connectivity to database

3. **Login not working:**
   - Verify admin user exists in database
   - Check JWT secret is set in `.env`
   - Clear browser cookies and try again

4. **Map not displaying:**
   - Check browser console for JavaScript errors
   - Verify Leaflet CDN resources are loading
   - Ensure network connectivity for OpenStreetMap tiles

## 📝 **Development**

### Adding New Features:
1. Backend: Add routes in `routes/` directory
2. Frontend: Update `public/static/js/main.js`
3. Database: Add migrations to `scripts/`
4. Styling: Update `public/static/css/style.css`

### Code Style:
- Use ES6+ JavaScript features
- Follow RESTful API conventions
- Implement proper error handling
- Add appropriate logging

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🙏 **Acknowledgments**

- OpenStreetMap contributors for map data
- Leaflet team for the mapping library
- Express.js team for the web framework
- PostgreSQL team for the database system

---

**🌟 Ready to explore Dubai interactively!** 

Access the application at `http://localhost:3000` and start adding your favorite Dubai locations! 