# Dubai Interactive Map with Authentication & Database

A Next.js application featuring an interactive map of Dubai where users can view markers with multimedia content. Includes PostgreSQL database integration with user authentication and role-based access control.

## Features

- 🗺️ Interactive map centered on Dubai using Leaflet and OpenStreetMap tiles
- 🔐 **User Authentication System** with login/logout functionality
- 👑 **Role-Based Access Control** (Admin users can add/delete, normal users view-only)
- 🗄️ **PostgreSQL Database Integration** for persistent data storage
- 📍 Click to add custom markers (admin only)
- 🏷️ Add titles and descriptions to markers
- 📸 Upload multiple images for rich galleries
- 🎬 **YouTube Video Support** - embed videos in marker popups
- 🖼️ Image preview in marker creation modal
- 📱 Responsive design that works on desktop and mobile
- ⚡ Server-Side Rendering (SSR) safe with dynamic imports
- 🎨 Modern, clean UI with proper accessibility features

## Database & Authentication

### PostgreSQL Configuration
- **Host:** 3.228.40.132
- **Database:** live
- **Username:** postgres
- **Password:** 123

### User Types
1. **Admin Users**
   - **Username:** admin
   - **Password:** admin
   - **Permissions:** Can add new markers, delete existing markers, view all markers

2. **Normal Users**
   - **Permissions:** View-only access to all markers
   - **Note:** Any login credentials other than admin/admin will be treated as normal user

3. **Guest Users**
   - **Permissions:** View-only access to all markers without login required

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm, yarn, or pnpm
- PostgreSQL database access (configured automatically)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### For All Users (Including Guests)
1. **View the Map**: The application loads with an interactive map centered on Dubai
2. **Explore Markers**: Click on any existing marker to see its popup with multimedia content
3. **View Galleries**: Navigate through multiple images and videos in marker popups

### For Admin Users
1. **Login**: Click the "Login" button and use admin/admin credentials
2. **Add Markers**: Click anywhere on the map to open the marker creation modal
3. **Create Rich Content**: 
   - Enter title and description
   - Upload an icon image for the map marker
   - Add multiple images and YouTube videos
   - Preview content before submission
4. **Delete Markers**: Click the 🗑️ button in any marker popup to delete it
5. **Logout**: Use the logout button when finished

### For Normal Users
1. **Login**: Click "Login" and use any credentials other than admin/admin
2. **View Content**: Browse all markers and their multimedia content
3. **Read-Only Access**: Cannot add or delete markers

## Technology Stack

- **Next.js 14** - React framework with SSR support
- **React 18** - UI library
- **PostgreSQL** - Database for persistent storage
- **React Leaflet** - React components for Leaflet maps
- **Leaflet** - Open-source JavaScript library for interactive maps
- **OpenStreetMap** - Map tile provider
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **FileReader API** - For converting images to base64

## Database Schema

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
  content_items JSONB NOT NULL,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Markers
- `GET /api/markers` - Fetch all markers (public)
- `POST /api/markers` - Create new marker (admin only)
- `DELETE /api/markers/[id]` - Delete marker by ID (admin only)

## Project Structure

```
dubai-map/
├── components/
│   ├── DubaiMap.js          # Main map component with auth integration
│   └── LoginModal.js        # Authentication modal
├── pages/
│   ├── api/
│   │   ├── auth/            # Authentication endpoints
│   │   │   ├── login.js     # Login API
│   │   │   ├── logout.js    # Logout API
│   │   │   └── me.js        # Current user API
│   │   └── markers/         # Marker CRUD endpoints
│   │       ├── index.js     # Get/Create markers
│   │       └── [id].js      # Delete marker by ID
│   ├── _app.js              # Custom App component
│   └── index.js             # Home page with dynamic import
├── lib/
│   └── db.js                # PostgreSQL connection and setup
├── styles/
│   └── globals.css          # Global styles
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
└── README.md               # This file
```

## Key Features Explained

### Authentication Flow
1. Users click "Login" button
2. Modal presents login form with demo credentials
3. JWT token stored in HTTP-only cookie upon successful login
4. Role-based UI updates (admin vs normal user vs guest)
5. Protected API endpoints check authentication and roles

### Marker Management
- **View**: All users can see markers from database
- **Create**: Only admin users can add new markers
- **Delete**: Only admin users can remove markers
- **Persistence**: All data stored in PostgreSQL database

### Media Gallery System
- **Mixed Content**: Support for both images and YouTube videos
- **Thumbnail Navigation**: Click to switch between content items
- **Video Integration**: Automatic YouTube thumbnail fetching
- **Base64 Storage**: Images converted to base64 for database storage

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **HTTP-Only Cookies**: JWT tokens not accessible via JavaScript
- **Role-Based Access**: API endpoints check user permissions
- **Input Validation**: Server-side validation for all data
- **SQL Injection Protection**: Parameterized queries

## Browser Support

- Modern browsers with ES6+ support
- FileReader API support
- CSS Grid and Flexbox support
- Cookie support for authentication

## Performance Considerations

- Images converted to base64 for simplicity (consider cloud storage for production)
- Dynamic imports prevent Leaflet SSR issues
- Database connection pooling for efficient queries
- Responsive design for mobile optimization
- Lazy loading of multimedia content

## Customization

### Changing Database Configuration
Update the connection details in `lib/db.js`:
```javascript
const pool = new Pool({
  host: 'your-host',
  database: 'your-database',
  user: 'your-username',
  password: 'your-password',
  port: 5432
});
```

### Adding New User Roles
1. Update the users table schema
2. Modify authentication middleware in API routes
3. Update frontend role checks in components

### Changing Map Center
Update the `DUBAI_CENTER` constant in `components/DubaiMap.js`:
```javascript
const DUBAI_CENTER = [latitude, longitude];
```

## Deployment

Build the application for production:
```bash
npm run build
npm start
```

### Environment Variables (Production)
Create a `.env.local` file:
```
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production
```

The application can be deployed to any platform that supports Next.js:
- Vercel (recommended)
- Netlify
- AWS
- Docker

## Demo Credentials

- **Admin Access:** username: `admin`, password: `admin`
- **Normal User:** Any other username/password combination

## License

This project is open source and available under the MIT License. 