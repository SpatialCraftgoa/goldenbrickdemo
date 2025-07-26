#!/bin/bash

# 🚀 Dubai Interactive Map - Apache Ubuntu Deployment Script
# This script will deploy your application to Apache on Ubuntu

set -e  # Exit on any error

echo "🌟 Starting Dubai Interactive Map deployment on Apache Ubuntu..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dubaimap"
APP_DIR="/var/www/$APP_NAME"
DOMAIN_NAME="your-domain.com"  # Change this to your domain
NODE_PORT="3000"

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  App Name: $APP_NAME"
echo -e "  App Directory: $APP_DIR"
echo -e "  Domain: $DOMAIN_NAME"
echo -e "  Node.js Port: $NODE_PORT"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "${GREEN}📍 Step $1: $2${NC}"
}

# Step 1: Update system
print_step "1" "Updating Ubuntu system packages"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Apache
print_step "2" "Installing Apache web server"
if ! command_exists apache2; then
    sudo apt install apache2 -y
    echo -e "${GREEN}✅ Apache installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Apache already installed${NC}"
fi

# Step 3: Enable required Apache modules
print_step "3" "Enabling required Apache modules"
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate

# Step 4: Install Node.js
print_step "4" "Installing Node.js 18.x"
if ! command_exists node; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install nodejs -y
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js already installed: $(node --version)${NC}"
fi

# Step 5: Install PM2
print_step "5" "Installing PM2 process manager"
if ! command_exists pm2; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 already installed${NC}"
fi

# Step 6: Create application directory
print_step "6" "Creating application directory"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Step 7: Copy application files (if in current directory)
print_step "7" "Copying application files"
if [ -f "package.json" ]; then
    echo -e "${BLUE}📁 Copying files from current directory...${NC}"
    sudo cp -r . $APP_DIR/
    sudo chown -R www-data:www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR
    echo -e "${GREEN}✅ Files copied successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No package.json found. Please copy your application files to $APP_DIR manually${NC}"
fi

# Step 8: Install Node.js dependencies
print_step "8" "Installing Node.js dependencies"
cd $APP_DIR
sudo -u www-data npm install --production
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 9: Create Apache virtual host configuration
print_step "9" "Creating Apache virtual host configuration"
sudo tee /etc/apache2/sites-available/$APP_NAME.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN_NAME
    ServerAlias www.$DOMAIN_NAME
    
    # Document root for static files
    DocumentRoot $APP_DIR/public
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Proxy API requests to Node.js
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:$NODE_PORT/api/
    ProxyPassReverse /api/ http://localhost:$NODE_PORT/api/
    
    # Serve static files directly from Apache
    Alias /static $APP_DIR/public/static
    <Directory "$APP_DIR/public/static">
        Options -Indexes
        AllowOverride None
        Require all granted
        
        # Enable compression for static assets
        <IfModule mod_deflate.c>
            SetOutputFilter DEFLATE
            SetEnvIfNoCase Request_URI \
                \.(?:gif|jpe?g|png)$ no-gzip dont-vary
            SetEnvIfNoCase Request_URI \
                \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
        </IfModule>
        
        # Cache static assets
        <IfModule mod_expires.c>
            ExpiresActive On
            ExpiresByType image/svg+xml "access plus 1 month"
            ExpiresByType image/png "access plus 1 month"
            ExpiresByType image/jpg "access plus 1 month"
            ExpiresByType image/jpeg "access plus 1 month"
            ExpiresByType text/css "access plus 1 month"
            ExpiresByType application/javascript "access plus 1 month"
            ExpiresByType application/font-woff "access plus 1 year"
            ExpiresByType application/font-woff2 "access plus 1 year"
        </IfModule>
    </Directory>
    
    # Serve main HTML file and handle SPA routing
    <Directory "$APP_DIR/public">
        Options -Indexes
        AllowOverride None
        Require all granted
        DirectoryIndex index.html
        
        # Handle client-side routing for SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteCond %{REQUEST_URI} !^/static/
        RewriteRule . /index.html [L]
    </Directory>
    
    # Handle uploads directory
    ProxyPass /uploads/ http://localhost:$NODE_PORT/uploads/
    ProxyPassReverse /uploads/ http://localhost:$NODE_PORT/uploads/
    
    # Logging
    ErrorLog \${APACHE_LOG_DIR}/${APP_NAME}_error.log
    CustomLog \${APACHE_LOG_DIR}/${APP_NAME}_access.log combined
    LogLevel warn
</VirtualHost>
EOF

echo -e "${GREEN}✅ Apache virtual host created${NC}"

# Step 10: Enable the site
print_step "10" "Enabling the website"
sudo a2ensite $APP_NAME.conf
sudo a2dissite 000-default.conf  # Disable default site
sudo systemctl reload apache2
echo -e "${GREEN}✅ Site enabled and Apache reloaded${NC}"

# Step 11: Create PM2 ecosystem file
print_step "11" "Creating PM2 ecosystem configuration"
sudo tee $APP_DIR/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: $NODE_PORT
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: $NODE_PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
}
EOF

# Step 12: Create logs directory
print_step "12" "Creating logs directory"
sudo mkdir -p $APP_DIR/logs
sudo chown -R www-data:www-data $APP_DIR/logs

# Step 13: Start the application with PM2
print_step "13" "Starting application with PM2"
cd $APP_DIR
sudo -u www-data pm2 start ecosystem.config.js --env production
sudo -u www-data pm2 save
sudo pm2 startup
echo -e "${GREEN}✅ Application started with PM2${NC}"

# Step 14: Configure firewall (if ufw is active)
print_step "14" "Configuring firewall"
if command_exists ufw && sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow 'Apache Full'
    sudo ufw allow ssh
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not active or not installed${NC}"
fi

# Step 15: Test configuration
print_step "15" "Testing Apache configuration"
if sudo apache2ctl configtest; then
    echo -e "${GREEN}✅ Apache configuration is valid${NC}"
else
    echo -e "${RED}❌ Apache configuration has errors${NC}"
    exit 1
fi

# Final output
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "1. Update DNS to point $DOMAIN_NAME to this server's IP"
echo -e "2. Install SSL certificate: sudo apt install certbot python3-certbot-apache"
echo -e "3. Get SSL certificate: sudo certbot --apache -d $DOMAIN_NAME"
echo -e "4. Set up environment variables in $APP_DIR/.env"
echo ""
echo -e "${BLUE}🔗 Access your application:${NC}"
echo -e "  HTTP: http://$DOMAIN_NAME"
echo -e "  Direct IP: http://\$(curl -s ifconfig.me)"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "  Check PM2 status: sudo -u www-data pm2 status"
echo -e "  View PM2 logs: sudo -u www-data pm2 logs"
echo -e "  Restart app: sudo -u www-data pm2 restart $APP_NAME-app"
echo -e "  Check Apache status: sudo systemctl status apache2"
echo -e "  View Apache logs: sudo tail -f /var/log/apache2/${APP_NAME}_error.log"
echo ""
echo -e "${GREEN}✨ Your Dubai Interactive Map is now live!${NC}"
