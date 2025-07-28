#!/bin/bash

# Ubuntu Apache + Node.js Deployment Script
# Run as root or with sudo

echo "🚀 Starting Dubai Map Apache + Node.js deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# Install Apache and required modules
echo "📦 Installing Apache and modules..."
apt install -y apache2
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod headers
a2enmod ssl

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Install PostgreSQL client (if needed)
echo "📦 Installing PostgreSQL client..."
apt install -y postgresql-client

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/html/goldenbrickdemo
cd /var/www/html/goldenbrickdemo

# Clone or copy your application
echo "📁 Setting up application files..."
# You'll need to copy your files here or clone from git

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/html/goldenbrickdemo
chmod -R 755 /var/www/html/goldenbrickdemo

# Install application dependencies
echo "📦 Installing Node.js dependencies..."
cd /var/www/html/goldenbrickdemo
npm install

# Create environment file
echo "🔧 Creating environment file..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
JWT_SECRET=your-jwt-secret-here
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_PORT=5432
EOF

echo "⚠️  Please edit /var/www/html/goldenbrickdemo/.env with your actual values"

# Copy Apache configuration
echo "🔧 Setting up Apache configuration..."
cp apache-subdirectory.conf /etc/apache2/sites-available/goldenbrickdemo.conf

# Enable site
a2ensite goldenbrickdemo.conf

# Test Apache configuration
echo "🧪 Testing Apache configuration..."
apache2ctl configtest

if [ $? -eq 0 ]; then
    echo "✅ Apache configuration is valid"
    
    # Start Node.js application with PM2
    echo "🚀 Starting Node.js application..."
    cd /var/www/html/goldenbrickdemo
    pm2 start server.js --name "dubai-map"
    pm2 save
    pm2 startup
    
    # Restart Apache
    echo "🔄 Restarting Apache..."
    systemctl restart apache2
    
    # Enable services to start on boot
    systemctl enable apache2
    
    echo "✅ Deployment completed!"
    echo "📍 Your application should be available at: http://your-domain.com/goldenbrickdemo"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Edit /var/www/html/goldenbrickdemo/.env with your database credentials"
    echo "2. Update ServerName in /etc/apache2/sites-available/goldenbrickdemo.conf"
    echo "3. Set up SSL certificate (recommended)"
    echo "4. Configure firewall to allow HTTP/HTTPS traffic"
    
else
    echo "❌ Apache configuration has errors. Please check and fix before continuing."
    exit 1
fi
