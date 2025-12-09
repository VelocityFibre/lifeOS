#!/bin/bash

# LifeOS Frontend Deployment Script
# ==================================
# Deploy Expo web app to FibreFlow VPS

set -e

# Configuration
VPS_HOST="72.60.17.245"
VPS_USER="root"
VPS_PASSWORD="VeloF@2025@@"
DEPLOY_DIR="/var/www/lifeos-frontend"

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
echo "  LIFEOS FRONTEND DEPLOYMENT"
echo "=================================================="
echo ""
echo "Target: $VPS_USER@$VPS_HOST"
echo "Directory: $DEPLOY_DIR"
echo ""

# Check if dist exists
if [ ! -d "expo-app/dist" ]; then
    echo "Building Expo web app..."
    cd expo-app
    npx expo export --platform web
    cd ..
    success "Build complete"
else
    warning "Using existing build in expo-app/dist"
fi

# Create deployment package
echo ""
echo "Creating deployment package..."
cd expo-app
tar -czf ../lifeos-frontend.tar.gz -C dist .
cd ..

success "Package created"

# Upload to VPS
echo ""
echo "Uploading to VPS..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << ENDSSH
# Create directory
mkdir -p $DEPLOY_DIR

# Backup old version if exists
if [ -d "$DEPLOY_DIR/old" ]; then
    rm -rf $DEPLOY_DIR/old
fi

if [ -d "$DEPLOY_DIR/_expo" ]; then
    mv $DEPLOY_DIR/* $DEPLOY_DIR/../lifeos-frontend-backup/ 2>/dev/null || true
fi
ENDSSH

# Upload package
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no lifeos-frontend.tar.gz "$VPS_USER@$VPS_HOST:$DEPLOY_DIR/"

# Extract
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << ENDSSH
cd $DEPLOY_DIR
tar -xzf lifeos-frontend.tar.gz
rm lifeos-frontend.tar.gz

echo ""
echo "Files deployed:"
ls -lh
ENDSSH

# Cleanup local package
rm lifeos-frontend.tar.gz

success "Frontend deployed to VPS"

# Configure Nginx
echo ""
echo "Configuring Nginx..."

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'ENDSSH'
# Update Nginx config to serve both API and frontend
cat > /etc/nginx/sites-available/lifeos << 'EOF'
server {
    listen 80;
    server_name lifeos.fibreflow.app;

    # Frontend - Serve static files
    location / {
        root /var/www/lifeos-frontend;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API - Proxy to backend
    location /api/ {
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

# Test and reload
nginx -t && systemctl reload nginx
ENDSSH

success "Nginx configured"

echo ""
echo "=================================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
success "LifeOS Frontend deployed successfully!"
echo ""
echo "Access your app at:"
echo "  🌐 http://lifeos.fibreflow.app"
echo ""
echo "Next steps:"
echo "  1. Add DNS: lifeos.fibreflow.app → 72.60.17.245"
echo "  2. Set up SSL: ssh root@72.60.17.245 'certbot --nginx -d lifeos.fibreflow.app'"
echo ""
echo "Backend API:"
echo "  📡 http://lifeos.fibreflow.app/api"
echo ""
