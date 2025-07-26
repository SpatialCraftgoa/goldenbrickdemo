#!/bin/bash

# 🚀 Dubai Interactive Map - Subdirectory Deployment Script
# Deploy to /var/www/html/goldenbrickdemo

set -e

echo "🌟 Starting Dubai Interactive Map subdirectory deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_NAME="goldenbrickdemo"
APP_DIR="/var/www/html/$APP_NAME"
NODE_PORT="3000"

print_step() {
    echo -e "${GREEN}📍 Step $1: $2${NC}"
}

# Step 1: Create application directory
print_step "1" "Creating application directory at $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:www-data $APP_DIR

# Step 2: Copy application files
print_step "2" "Copying application files"
if [ -f "package.json" ]; then
    sudo cp -r . $APP_DIR/
    sudo chown -R www-data:www-data $APP_DIR
    sudo chmod -R 755 $APP_DIR
    echo -e "${GREEN}✅ Files copied successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Run this script from your project directory${NC}"
    exit 1
fi

# Step 3: Install dependencies
print_step "3" "Installing Node.js dependencies"
cd $APP_DIR
sudo -u www-data npm install --production

# Step 4: Create Apache configuration
print_step "4" "Creating Apache virtual host configuration"
sudo tee /etc/apache2/sites-available/$APP_NAME.conf > /dev/null <<'EOF'
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    # Serve the subdirectory application
    Alias /goldenbrickdemo /var/www/html/goldenbrickdemo/public
    
    # Proxy API requests to Node.js server
    ProxyPreserveHost On
    ProxyPass /goldenbrickdemo/api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /goldenbrickdemo/api/ http://127.0.0.1:3000/api/
    
    # Proxy uploads
    ProxyPass /goldenbrickdemo/uploads/ http://127.0.0.1:3000/uploads/
    ProxyPassReverse /goldenbrickdemo/uploads/ http://127.0.0.1:3000/uploads/
    
    # Static files served by Apache
    <Directory "/var/www/html/goldenbrickdemo/public">
        Options -Indexes
        AllowOverride All
        Require all granted
        DirectoryIndex index.html
        
        # Handle client-side routing with subdirectory
        RewriteEngine On
        RewriteBase /goldenbrickdemo/
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/goldenbrickdemo/api/
        RewriteCond %{REQUEST_URI} !^/goldenbrickdemo/uploads/
        RewriteRule . /goldenbrickdemo/index.html [L]
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/goldenbrickdemo_error.log
    CustomLog ${APACHE_LOG_DIR}/goldenbrickdemo_access.log combined
</VirtualHost>
EOF

# Step 5: Enable required modules
print_step "5" "Enabling Apache modules"
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers

# Step 6: Enable site
print_step "6" "Enabling the website"
sudo a2ensite $APP_NAME.conf
sudo systemctl reload apache2

# Step 7: Create PM2 ecosystem
print_step "7" "Creating PM2 configuration"
sudo tee $APP_DIR/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME-app',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env_production: {
      NODE_ENV: 'production',
      PORT: $NODE_PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Step 8: Create logs directory and start PM2
print_step "8" "Starting application with PM2"
sudo mkdir -p $APP_DIR/logs
sudo chown -R www-data:www-data $APP_DIR/logs
cd $APP_DIR
sudo -u www-data pm2 start ecosystem.config.js --env production
sudo -u www-data pm2 save

# Step 9: Test configuration
print_step "9" "Testing configuration"
echo "Testing Node.js server..."
sleep 3
curl -s http://localhost:3000/health && echo -e "${GREEN}✅ Node.js server running${NC}" || echo -e "${YELLOW}⚠️  Node.js server issue${NC}"

echo ""
echo -e "${GREEN}🎉 Subdirectory deployment completed!${NC}"
echo ""
echo -e "${BLUE}🔗 Access your application at:${NC}"
echo -e "  URL: http://your-domain.com/goldenbrickdemo"
echo -e "  Local: http://localhost/goldenbrickdemo"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "  PM2 status: sudo -u www-data pm2 status"
echo -e "  PM2 logs: sudo -u www-data pm2 logs $APP_NAME-app"
echo -e "  Apache logs: sudo tail -f /var/log/apache2/goldenbrickdemo_error.log"
echo ""
echo -e "${BLUE}🔧 API Test Commands:${NC}"
echo -e "  Test health: curl http://localhost:3000/health"
echo -e "  Test via Apache: curl http://localhost/goldenbrickdemo/api/auth/me"
