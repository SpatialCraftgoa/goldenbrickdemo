# 🗺️ Dubai Interactive Map Application

A sophisticated web application featuring an interactive map of Dubai with enhanced functionality for landmark exploration and plot management. Built with Node.js, Express, and Leaflet.js with advanced UI components and real-time features.

![Dubai Map Application](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎯 Core Functionality
- **🗺️ Interactive Leaflet Map**: High-performance mapping with Dubai focus and OpenStreetMap integration
- **🏛️ Landmark System**: 5 major Dubai landmarks (Burj Khalifa, Burj Al Arab, Dubai Frame, etc.) with custom SVG icons
- **📍 Plot Management**: Admin-controlled marker system with rich media support
- **🎛️ Enhanced Media Sliders**: Dots and arrow navigation for images/videos with smooth transitions
- **💾 Custom Confirmation Dialogs**: Beautiful styled confirmation prompts replacing browser alerts
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### � Authentication & Authorization
- **🔑 JWT-based Authentication**: Secure login system with HTTP-only cookies
- **👑 Role-based Access Control**: Admin vs Guest permissions with proper access restrictions
- **🔄 Session Management**: Persistent login sessions with automatic token refresh

### 📱 User Experience
- **🔍 Zoom-based Landmark Visibility**: Landmarks appear at appropriate zoom levels for optimal performance
- **🎨 Custom Icon Support**: Upload and manage custom marker icons with automatic circular formatting
- **📸 Media Integration**: Support for multiple images and YouTube videos with enhanced slider
- **🌐 Google Maps Integration**: Direct links to Google Maps for navigation and location sharing
- **⚡ Real-time Updates**: Instant UI updates without page refresh

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed ([Download here](https://nodejs.org/))
- **PostgreSQL** database access ([Installation guide](https://postgresql.org/download/))
- **npm** or **yarn** package manager
- **Git** for version control

### 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/SpatialCraftgoa/goldenbrickdemo.git
cd goldenbrickdemo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Configuration:**
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=dubaimap
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Upload Configuration
UPLOAD_MAX_SIZE=10485760  # 10MB max file size
SESSION_TIMEOUT=86400     # 24 hours session timeout
```

4. **Database Setup:**
```bash
# Initialize the database schema and create tables
node scripts/init-db.js

# Optional: Add category column if updating from older version
node scripts/add-category-column.js
```

## 🖥️ Local Development

### Running the Application
```bash
# Development mode with auto-restart (recommended)
npm run dev

# Standard production mode
npm start

# Or directly with Node.js
node server.js
```

The application will be available at: **http://localhost:3000**

### 🔑 Demo Credentials
- **👑 Admin Access**: 
  - Username: `admin`
  - Password: `admin`
- **👤 Guest Access**: Browse without login (read-only mode)

### 🛠️ Development Features
- ⚡ Real-time error handling and logging
- 🔄 Hot-reload capability with nodemon
- 🐛 Comprehensive console debugging
- 🌍 Development environment detection
- 📊 Performance monitoring

## 🌐 Apache Server Deployment

### Method 1: Reverse Proxy Configuration (Recommended)

1. **Install Apache and enable required modules:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install apache2
sudo a2enmod proxy proxy_http rewrite ssl headers
sudo systemctl restart apache2

# CentOS/RHEL/Amazon Linux
sudo yum install httpd
sudo systemctl enable httpd
sudo systemctl start httpd
```

2. **Create Apache Virtual Host configuration:**
```bash
sudo nano /etc/apache2/sites-available/dubaimap.conf
```

Add the following configuration:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    # Document root for static files
    DocumentRoot /var/www/dubaimap/public
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # Proxy API requests to Node.js
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    
    # Serve static files directly from Apache
    Alias /static /var/www/dubaimap/public/static
    <Directory "/var/www/dubaimap/public/static">
        Options -Indexes
        AllowOverride None
        Require all granted
        
        # Cache static assets
        <IfModule mod_expires.c>
            ExpiresActive On
            ExpiresByType image/svg+xml "access plus 1 month"
            ExpiresByType image/png "access plus 1 month"
            ExpiresByType text/css "access plus 1 month"
            ExpiresByType application/javascript "access plus 1 month"
        </IfModule>
    </Directory>
    
    # Serve main HTML file
    Alias / /var/www/dubaimap/public/index.html
    <Directory "/var/www/dubaimap/public">
        Options -Indexes
        AllowOverride None
        Require all granted
        DirectoryIndex index.html
    </Directory>
    
    # Fallback to Node.js for dynamic requests
    ProxyPass /uploads/ http://localhost:3000/uploads/
    ProxyPassReverse /uploads/ http://localhost:3000/uploads/
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/dubaimap_error.log
    CustomLog ${APACHE_LOG_DIR}/dubaimap_access.log combined
    LogLevel warn
</VirtualHost>
```

3. **Enable the site and restart Apache:**
```bash
sudo a2ensite dubaimap.conf
sudo a2dissite 000-default  # Disable default site
sudo systemctl reload apache2
```

4. **Deploy application files:**
```bash
# Create application directory
sudo mkdir -p /var/www/dubaimap

# Copy application files (adjust source path as needed)
sudo cp -r /path/to/your/dubaimap/* /var/www/dubaimap/
sudo chown -R www-data:www-data /var/www/dubaimap
sudo chmod -R 755 /var/www/dubaimap

# Install production dependencies
cd /var/www/dubaimap
sudo -u www-data npm install --production
```

### Method 2: Process Manager with PM2 (Production Recommended)

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Create PM2 ecosystem configuration:**
```bash
nano /var/www/dubaimap/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'dubaimap-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

3. **Start application with PM2:**
```bash
cd /var/www/dubaimap
mkdir logs  # Create logs directory
pm2 start ecosystem.config.js --env production
pm2 save    # Save PM2 configuration
pm2 startup # Enable auto-start on boot
```

4. **Monitor application:**
```bash
pm2 status        # Check status
pm2 logs dubaimap-app  # View logs
pm2 restart dubaimap-app  # Restart app
pm2 reload dubaimap-app   # Zero-downtime reload
```

### SSL Configuration (HTTPS) with Let's Encrypt

1. **Install Certbot:**
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-apache

# CentOS/RHEL
sudo yum install certbot python3-certbot-apache
```

2. **Obtain SSL certificate:**
```bash
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

3. **Configure automatic renewal:**
```bash
sudo crontab -e
# Add this line for automatic renewal:
0 12 * * * /usr/bin/certbot renew --quiet
```

4. **Update Apache configuration for HTTPS:**
The SSL configuration will be automatically added, but you may want to customize:
```apache
<VirtualHost *:443>
    ServerName your-domain.com
    
    # SSL Configuration (added by Certbot)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    
    # Enhanced security headers for HTTPS
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self';"
    
    # Rest of your configuration...
</VirtualHost>
```

## 📁 Project Structure

```
dubaimap/
├── 📄 server.js                    # Main Express server
├── 📄 package.json                 # Dependencies and scripts
├── 📄 README.md                    # This comprehensive guide
├── 📄 .env                         # Environment variables (create this)
├── 📄 ecosystem.config.js          # PM2 configuration (optional)
├── 📁 config/                      # Configuration files
├── 📁 routes/                      # API route handlers
│   ├── 📄 auth.js                  # Authentication endpoints
│   └── 📄 markers.js               # Marker CRUD operations
├── 📁 lib/                         # Utility libraries
│   └── 📄 db.js                    # Database connection and utilities
├── 📁 scripts/                     # Setup and maintenance scripts
│   ├── 📄 init-db.js               # Database schema initialization
│   └── 📄 add-category-column.js   # Database migration script
├── 📁 public/                      # Client-side static files
│   ├── 📄 index.html               # Main HTML application
│   └── 📁 static/
│       ├── 📁 css/
│       │   └── 📄 style.css        # Enhanced styling with animations
│       ├── 📁 js/
│       │   ├── 📄 main.js          # Core application logic
│       │   └── 📄 landmarks_data.js # Dubai landmark definitions
│       └── 📁 images/
│           ├── 📄 *.png            # Application logos and assets
│           └── 📁 markers/         # SVG landmark icons
│               ├── 📄 embedded.svg
│               ├── 📄 embedded_1.svg
│               ├── 📄 embedded_2.svg
│               ├── 📄 embedded_3.svg
│               └── 📄 embedded_4.svg
└── 📁 uploads/                     # User-uploaded content (created automatically)
```

## 🎨 Enhanced Features

### 🎛️ Advanced Slider System
- **Dot Navigation**: Click dots to jump to specific slides with smooth transitions
- **Arrow Controls**: Sequential navigation with intuitive left/right arrows
- **Touch Support**: Swipe gestures optimized for mobile devices
- **Auto-sizing**: Responsive design that adapts to all screen sizes
- **Keyboard Support**: Arrow keys for navigation, ESC to close

### 💾 Custom Dialog System
- **Styled Confirmations**: Beautiful replacements for browser alerts with animations
- **Smooth Transitions**: CSS-powered fade and scale animations
- **Accessibility**: Full keyboard navigation and screen reader support
- **Customizable**: Easy to theme and modify for different use cases

### 📸 Media Management
- **Image Optimization**: Automatic compression for faster loading times
- **YouTube Integration**: Seamless embedded video support with responsive sizing
- **Multiple Formats**: Support for JPG, PNG, WebP, and video formats
- **Preview System**: Real-time preview of selected media before upload

### 🗺️ Advanced Mapping
- **Zoom-based Visibility**: Landmarks appear at appropriate zoom levels for performance
- **Custom Markers**: SVG-based icons with hover effects and animations
- **Clustering**: Automatic marker clustering for better performance with many markers
- **Layer Management**: Separate layers for landmarks and user-added markers

## 🔧 Configuration Options

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost                    # PostgreSQL host address
DB_NAME=dubaimap                     # Database name
DB_USER=your_username                # Database username
DB_PASSWORD=your_secure_password     # Database password
DB_PORT=5432                         # PostgreSQL port (default: 5432)

# Security Configuration
JWT_SECRET=your_super_secret_key_256_bits_minimum  # JWT signing secret (change this!)
SESSION_TIMEOUT=86400                # Session timeout in seconds (24 hours)

# Server Configuration
PORT=3000                           # Application server port
NODE_ENV=production                 # Environment: development|production
HOST=0.0.0.0                       # Host binding (0.0.0.0 for all interfaces)

# Upload Configuration
UPLOAD_MAX_SIZE=10485760            # Maximum upload size in bytes (10MB)
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp  # Allowed MIME types

# Performance Configuration
MAX_CONNECTIONS=100                 # Maximum database connections
CONNECTION_TIMEOUT=30000            # Database connection timeout (30 seconds)

# Security Headers
CORS_ORIGIN=https://your-domain.com # CORS allowed origin
CSP_POLICY=default-src 'self'       # Content Security Policy

# Logging
LOG_LEVEL=info                      # Logging level: error|warn|info|debug
LOG_FILE=/var/log/dubaimap.log      # Log file path (optional)
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run debug        # Start with debugging enabled
npm run test         # Run test suite (if available)

# Production
npm start            # Start production server
npm run build        # Build optimized assets (if applicable)
npm run prod         # Start with production optimizations

# Database
npm run init-db      # Initialize database schema
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data

# Maintenance
npm run logs         # View application logs
npm run cleanup      # Clean temporary files
npm run backup       # Backup database (if configured)
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. **Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check if database exists
psql -h localhost -U postgres -l

# Test connection
psql -h localhost -U your_username -d dubaimap -c "SELECT version();"
```

#### 2. **Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000
netstat -tlnp | grep :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### 3. **Permission Denied (Apache/File System)**
```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/dubaimap
sudo chmod -R 755 /var/www/dubaimap

# Fix upload directory permissions
sudo mkdir -p /var/www/dubaimap/uploads
sudo chown -R www-data:www-data /var/www/dubaimap/uploads
sudo chmod -R 775 /var/www/dubaimap/uploads
```

#### 4. **Node.js Version Issues**
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

#### 5. **SSL Certificate Issues**
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Renew certificate manually
sudo certbot renew --dry-run

# Check certificate expiration
sudo certbot certificates
```

#### 6. **Map Not Loading**
- Check browser console for JavaScript errors
- Verify internet connection for map tiles
- Ensure Leaflet CDN resources are accessible
- Check Content Security Policy settings

#### 7. **File Upload Issues**
- Verify upload directory exists and is writable
- Check file size limits in configuration
- Ensure proper MIME type validation
- Check available disk space

## 📊 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better query performance
CREATE INDEX idx_markers_location ON markers(latitude, longitude);
CREATE INDEX idx_markers_created_by ON markers(created_by);
CREATE INDEX idx_markers_created_at ON markers(created_at);

-- Enable query performance monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log slow queries
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

### Frontend Optimization
- **Image Compression**: Automatic optimization of uploaded images
- **Asset Minification**: CSS and JavaScript minification for production
- **Caching**: Browser caching for static assets with proper headers
- **Lazy Loading**: Images and content loaded on demand
- **CDN Integration**: Use CDN for static assets in production

### Server Optimization
```bash
# Enable gzip compression in Apache
sudo a2enmod deflate
sudo systemctl reload apache2

# Optimize Node.js for production
export NODE_ENV=production
export UV_THREADPOOL_SIZE=4  # Adjust based on CPU cores
```

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **HTTP-Only Cookies**: Prevent XSS token theft
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Admin vs user permissions
- **Session Management**: Automatic token refresh

### Input Validation & Sanitization
- **File Upload Security**: MIME type and size validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization and CSP headers
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: API endpoint rate limiting

### Security Headers
```javascript
// Implemented security headers
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
}
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database initialized and migrated
- [ ] SSL certificate obtained and configured
- [ ] Security headers implemented
- [ ] Performance optimizations applied
- [ ] Backup strategy in place

### Production Deployment
- [ ] Apache/Nginx configured with reverse proxy
- [ ] PM2 process manager setup
- [ ] Monitoring and logging configured
- [ ] Error handling and reporting setup
- [ ] Load balancing configured (if needed)
- [ ] CDN setup for static assets

### Post-deployment
- [ ] Application functionality tested
- [ ] SSL certificate verified
- [ ] Performance metrics baseline established
- [ ] Monitoring alerts configured
- [ ] Backup procedure tested
- [ ] Documentation updated

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow coding standards**: ESLint configuration provided
3. **Write tests** for new functionality
4. **Update documentation** for any API changes
5. **Submit a pull request** with detailed description

### Development Setup for Contributors
```bash
# Clone your fork
git clone https://github.com/yourusername/goldenbrickdemo.git
cd goldenbrickdemo

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run dev

# Commit and push
git add .
git commit -m "Add your feature description"
git push origin feature/your-feature-name
```

## 📈 Future Enhancements

### Planned Features
- [ ] **Multi-language Support**: Arabic and English localization
- [ ] **Advanced Search**: Filter markers by category, date, or content
- [ ] **Offline Capabilities**: Service worker for offline map access
- [ ] **Real-time Collaboration**: Multiple users editing simultaneously
- [ ] **Mobile App**: React Native companion app
- [ ] **Analytics Dashboard**: Usage statistics and insights
- [ ] **Export Features**: PDF reports and data export
- [ ] **Integration APIs**: Third-party service integrations

### Technical Improvements
- [ ] **Microservices Architecture**: Split into smaller services
- [ ] **GraphQL API**: Replace REST with GraphQL
- [ ] **Redis Caching**: Implement caching layer
- [ ] **Elasticsearch**: Advanced search capabilities
- [ ] **Docker Support**: Containerization for easy deployment
- [ ] **Kubernetes**: Orchestration for scaling
- [ ] **CI/CD Pipeline**: Automated testing and deployment

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 SpatialCraft & Golden Bricks Real Estate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🙋‍♂️ Support & Contact

### Get Help
- 📧 **Email Support**: support@spatialcraft.in
- 🌐 **Website**: [SpatialCraft](https://spatialcraft.in)
- 📁 **GitHub Issues**: [Report Bug or Request Feature](https://github.com/SpatialCraftgoa/goldenbrickdemo/issues)
- 📚 **Documentation**: [Wiki](https://github.com/SpatialCraftgoa/goldenbrickdemo/wiki)

### Commercial Support
For enterprise deployment, custom development, or commercial support:
- **SpatialCraft**: Professional GIS and mapping solutions
- **Golden Bricks Real Estate**: Dubai property expertise
- **Custom Development**: Tailored mapping applications

### Community
- 💬 **Discussions**: [GitHub Discussions](https://github.com/SpatialCraftgoa/goldenbrickdemo/discussions)
- 🐛 **Bug Reports**: Use GitHub Issues with bug template
- 💡 **Feature Requests**: Use GitHub Issues with feature template
- 🔄 **Pull Requests**: Contributions are welcome!

---

**🌟 Built with ❤️ by [SpatialCraft](https://spatialcraft.in) & [Golden Bricks Real Estate](https://goldenbricks.ae)**

*Making Dubai's geography interactive and accessible to everyone.*

---

### Quick Links
- [🚀 Quick Start](#-quick-start)
- [🌐 Apache Deployment](#-apache-server-deployment)
- [🔧 Configuration](#-configuration-options)
- [🚨 Troubleshooting](#-troubleshooting)
- [🛡️ Security](#️-security-features)
- [🤝 Contributing](#-contributing)

**Version**: 2.0.0 | **Last Updated**: December 2024 | **Status**: Production Ready ✅ 