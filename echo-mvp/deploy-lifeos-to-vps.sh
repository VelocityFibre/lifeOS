#!/bin/bash

# LifeOS VPS Deployment Script
# ==============================
# Deploy to FibreFlow VPS (72.60.17.245)

set -e

# Configuration
VPS_HOST="72.60.17.245"
VPS_USER="root"
VPS_PASSWORD="VeloF@2025@@"
DEPLOY_DIR="/var/www/lifeos"
PM2_PROCESS_NAME="lifeos-api"
PORT="3009"  # Ports: 3005=FF-Prod, 3006=FF-Dev, 3007=ACH, 3008=Foxy

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "=================================================="
echo "  LIFEOS VPS DEPLOYMENT"
echo "=================================================="
echo ""
echo "Target: $VPS_USER@$VPS_HOST"
echo "Directory: $DEPLOY_DIR"
echo "Port: $PORT"
echo ""

# Build application
echo "Building application..."
cd mastra-backend

# Skip npm install - use existing node_modules
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

npm run build

success "Application built"
cd ..

# Create deployment package
echo ""
echo "Creating deployment package..."

TEMP_DIR=$(mktemp -d)

# Copy files
cp -r mastra-backend/dist "$TEMP_DIR/"
cp -r mastra-backend/node_modules "$TEMP_DIR/"
cp mastra-backend/package.json "$TEMP_DIR/"
cp mastra-backend/.env "$TEMP_DIR/"

# Create tarball
tar -czf lifeos-backend.tar.gz -C "$TEMP_DIR" .
rm -rf "$TEMP_DIR"

success "Package created"

# Upload to VPS
echo ""
echo "Uploading to VPS..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << ENDSSH
# Create directory
mkdir -p $DEPLOY_DIR

# Stop existing process if running
pm2 stop $PM2_PROCESS_NAME 2>/dev/null || true
pm2 delete $PM2_PROCESS_NAME 2>/dev/null || true
ENDSSH

# Upload package
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no lifeos-backend.tar.gz "$VPS_USER@$VPS_HOST:$DEPLOY_DIR/"

# Extract and configure
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << ENDSSH
cd $DEPLOY_DIR

# Extract
tar -xzf lifeos-backend.tar.gz
rm lifeos-backend.tar.gz

# Update port in .env (server uses API_PORT variable)
sed -i 's/PORT=.*/PORT=$PORT/' .env
echo "API_PORT=$PORT" >> .env

# Start with PM2
pm2 start dist/api/server.js --name $PM2_PROCESS_NAME
pm2 save

# Show status
pm2 list
ENDSSH

# Cleanup local package
rm lifeos-backend.tar.gz

success "Deployed to VPS"

# Configure Nginx
echo ""
echo "Configuring Nginx..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'ENDSSH'
# Create Nginx config
cat > /etc/nginx/sites-available/lifeos << 'EOF'
server {
    listen 80;
    server_name lifeos.fibreflow.app;

    location / {
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/lifeos /etc/nginx/sites-enabled/

# Test and reload
nginx -t && systemctl reload nginx
ENDSSH

success "Nginx configured"

echo ""
echo "=================================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
success "LifeOS API is running at: http://72.60.17.245:$PORT"
echo ""
echo "Next steps:"
echo "  1. Add DNS: lifeos.fibreflow.app → 72.60.17.245"
echo "  2. Set up SSL: certbot --nginx -d lifeos.fibreflow.app"
echo "  3. Access at: https://lifeos.fibreflow.app"
echo ""
echo "Useful commands:"
echo "  Check status:  sshpass -p '$VPS_PASSWORD' ssh root@$VPS_HOST 'pm2 list'"
echo "  View logs:     sshpass -p '$VPS_PASSWORD' ssh root@$VPS_HOST 'pm2 logs $PM2_PROCESS_NAME'"
echo "  Restart:       sshpass -p '$VPS_PASSWORD' ssh root@$VPS_HOST 'pm2 restart $PM2_PROCESS_NAME'"
echo ""
