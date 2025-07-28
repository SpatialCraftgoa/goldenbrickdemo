#!/bin/bash

echo "=== Apache Troubleshooting Script ==="
echo "This script will diagnose and fix Apache issues"
echo

# Step 1: Check current status
echo "1. Checking Apache status..."
sudo systemctl status apache2 || echo "Apache is not running"
echo

# Step 2: Force kill Apache processes
echo "2. Force killing any Apache processes..."
sudo pkill -9 apache2 2>/dev/null || echo "No Apache processes to kill"
sudo pkill -9 httpd 2>/dev/null || echo "No httpd processes to kill"
echo

# Step 3: Check what's using port 80
echo "3. Checking what's using port 80..."
sudo lsof -i :80 || echo "Port 80 is free"
echo

# Step 4: Check for nginx (common conflict)
echo "4. Checking for nginx..."
if systemctl is-active --quiet nginx; then
    echo "WARNING: nginx is running and may conflict with Apache"
    echo "Would you like to stop nginx? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        sudo systemctl stop nginx
        sudo systemctl disable nginx
        echo "nginx stopped and disabled"
    fi
fi
echo

# Step 5: Clean up old Apache configs
echo "5. Cleaning up Apache configurations..."
sudo a2dissite 000-default 2>/dev/null || echo "Default site already disabled"
sudo a2dissite goldenbrickdemo 2>/dev/null || echo "goldenbrickdemo site not enabled"
sudo a2dissite default-ssl 2>/dev/null || echo "SSL site already disabled"
echo

# Step 6: Enable required modules
echo "6. Enabling required Apache modules..."
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
echo

# Step 7: Create simple working config
echo "7. Creating working Apache configuration..."
cat > /tmp/goldenbrickdemo.conf << 'EOF'
<VirtualHost *:80>
    ServerName sidm.spatialcraft.in
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
        
        # Handle client-side routing
        RewriteEngine On
        RewriteBase /goldenbrickdemo/
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/goldenbrickdemo/api/
        RewriteCond %{REQUEST_URI} !^/goldenbrickdemo/uploads/
        RewriteRule . /goldenbrickdemo/index.html [L]
    </Directory>
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/goldenbrickdemo_error.log
    CustomLog ${APACHE_LOG_DIR}/goldenbrickdemo_access.log combined
</VirtualHost>
EOF

sudo cp /tmp/goldenbrickdemo.conf /etc/apache2/sites-available/
echo "Configuration created"
echo

# Step 8: Test configuration
echo "8. Testing Apache configuration..."
sudo apache2ctl configtest
if [ $? -eq 0 ]; then
    echo "Configuration test passed!"
else
    echo "Configuration test failed! Check the output above."
    exit 1
fi
echo

# Step 9: Enable site
echo "9. Enabling site..."
sudo a2ensite goldenbrickdemo
echo

# Step 10: Start Apache
echo "10. Starting Apache..."
sudo systemctl start apache2
sleep 2

# Step 11: Check status
echo "11. Checking Apache status..."
if systemctl is-active --quiet apache2; then
    echo "✅ Apache is running successfully!"
    
    # Test the endpoints
    echo "12. Testing endpoints..."
    echo "Testing direct Node.js server..."
    curl -s http://127.0.0.1:3000/health && echo " ✅ Node.js health check OK" || echo " ❌ Node.js not responding"
    
    echo "Testing Apache proxy..."
    curl -s http://sidm.spatialcraft.in/goldenbrickdemo/api/health && echo " ✅ Apache proxy OK" || echo " ❌ Apache proxy not working"
    
else
    echo "❌ Apache failed to start. Checking logs..."
    sudo journalctl -u apache2 --no-pager -l | tail -10
fi

echo
echo "=== Script completed ==="
