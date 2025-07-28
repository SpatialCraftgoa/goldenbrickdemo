# Apache Ubuntu Deployment Guide

## Migration from Netlify to Apache + Node.js

### Prerequisites
- Ubuntu 18.04+ server
- Root or sudo access
- Domain name pointing to your server
- PostgreSQL database (can be hosted or local)

### Step 1: Prepare Your Server

```bash
# Run the deployment script
chmod +x deploy-apache-ubuntu.sh
sudo ./deploy-apache-ubuntu.sh
```

### Step 2: Upload Your Application Files

```bash
# Copy your application files to the server
scp -r * user@your-server:/var/www/html/goldenbrickdemo/

# Or clone from git
cd /var/www/html/goldenbrickdemo
git clone https://github.com/SpatialCraftgoa/goldenbrickdemo.git .
```

### Step 3: Configure Environment

```bash
# Edit the environment file
sudo nano /var/www/html/goldenbrickdemo/.env

# Update with your actual values:
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
DB_HOST=your-postgres-host
DB_NAME=dubaimap
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_PORT=5432
```

### Step 4: Configure Apache

```bash
# Edit Apache configuration
sudo nano /etc/apache2/sites-available/goldenbrickdemo.conf

# Update ServerName to your actual domain
ServerName yourdomain.com
ServerAlias www.yourdomain.com
```

### Step 5: Install Dependencies and Start Services

```bash
cd /var/www/html/goldenbrickdemo

# Install Node.js dependencies
npm install

# Start the application with PM2
pm2 start ecosystem.config.json
pm2 save
pm2 startup

# Test Apache configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

### Step 6: Database Setup

If you need to set up PostgreSQL locally:

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE dubaimap;
CREATE USER dbuser WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE dubaimap TO dbuser;
\q

# Import your database schema
psql -h localhost -U dbuser -d dubaimap < your-database-dump.sql
```

### Step 7: SSL Configuration (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal will be set up automatically
```

### Step 8: Firewall Configuration

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Apache Full'
sudo ufw allow ssh
sudo ufw enable
```

## Key Differences from Netlify

### 1. API Endpoints
- **Netlify**: `/.netlify/functions/function-name`
- **Apache**: `/goldenbrickdemo/api/endpoint`

### 2. Environment Variables
- **Netlify**: Set in Netlify dashboard
- **Apache**: Set in `.env` file

### 3. Database Connection
- **Netlify**: Uses environment variables
- **Apache**: Uses `.env` file with same variables

### 4. File Storage
- **Netlify**: Base64 encoding in database
- **Apache**: Same approach, but you could optionally use file system

## Monitoring and Maintenance

### Check Application Status
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dubai-map

# Restart application
pm2 restart dubai-map
```

### Check Apache Status
```bash
# Check Apache status
sudo systemctl status apache2

# View Apache logs
sudo tail -f /var/log/apache2/goldenbrickdemo_access.log
sudo tail -f /var/log/apache2/goldenbrickdemo_error.log
```

### Database Backup
```bash
# Create database backup
pg_dump -h localhost -U dbuser dubaimap > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Node.js app not running
   ```bash
   pm2 restart dubai-map
   ```

2. **404 on API calls**: Apache proxy not configured
   ```bash
   sudo a2enmod proxy proxy_http
   sudo systemctl restart apache2
   ```

3. **Database connection errors**: Check `.env` file and database credentials

4. **File permissions**: 
   ```bash
   sudo chown -R www-data:www-data /var/www/html/goldenbrickdemo
   sudo chmod -R 755 /var/www/html/goldenbrickdemo
   ```

## Performance Optimization

### 1. Enable Gzip Compression
Add to Apache configuration:
```apache
<Directory "/var/www/html/goldenbrickdemo/public">
    # Enable compression
    LoadModule deflate_module modules/mod_deflate.so
    SetOutputFilter DEFLATE
    
    # Compress specific file types
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</Directory>
```

### 2. Set Cache Headers
```apache
# Cache static assets
<Directory "/var/www/html/goldenbrickdemo/public/static">
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresDefault "access plus 2 days"
</Directory>
```

Your application should now be fully functional on Apache with Node.js!
