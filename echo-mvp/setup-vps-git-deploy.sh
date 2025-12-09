#!/bin/bash

# VPS Git-Based Deployment Setup
# ===============================
# Run this ONCE to set up Git-based deployment on the VPS

set -e

VPS_HOST="72.60.17.245"
VPS_PASSWORD="VeloF@2025@@"
GITHUB_REPO="https://github.com/VelocityFibre/lifeOS.git"

echo "=================================================="
echo "  SETUP VPS GIT-BASED DEPLOYMENT"
echo "=================================================="
echo ""
echo "This will:"
echo "  1. Clone GitHub repo to /var/www/lifeos-repo"
echo "  2. Install dependencies"
echo "  3. Copy .env from current deployment"
echo "  4. Build the application"
echo "  5. Update PM2 to use new location"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no root@$VPS_HOST << ENDSSH
set -e

echo "Step 1: Cloning repository..."
cd /var/www
if [ -d "lifeos-repo" ]; then
    echo "Repository already exists. Pulling latest..."
    cd lifeos-repo
    git pull origin main
else
    git clone $GITHUB_REPO lifeos-repo
    cd lifeos-repo
fi

echo ""
echo "Step 2: Setting up backend..."
cd mastra-backend

# Copy .env from current deployment
if [ -f "/var/www/lifeos/.env" ]; then
    echo "Copying .env from current deployment..."
    cp /var/www/lifeos/.env .env
else
    echo "⚠️  WARNING: No .env found in /var/www/lifeos"
    echo "You'll need to create .env manually with:"
    echo "  - DATABASE_URL"
    echo "  - OPENAI_API_KEY"
    echo "  - JWT_SECRET"
fi

# Install dependencies
echo ""
echo "Step 3: Installing dependencies..."
npm ci --production

# Build
echo ""
echo "Step 4: Building application..."
npm run build

# Update PM2
echo ""
echo "Step 5: Updating PM2..."
pm2 stop lifeos-api 2>/dev/null || true
pm2 delete lifeos-api 2>/dev/null || true
pm2 start dist/api/server.js --name lifeos-api
pm2 save

echo ""
echo "✅ Setup complete!"
pm2 list | grep lifeos-api
ENDSSH

echo ""
echo "=================================================="
echo "  SETUP COMPLETE!"
echo "=================================================="
echo ""
echo "✅ Git repository cloned to /var/www/lifeos-repo"
echo "✅ Dependencies installed"
echo "✅ Application built"
echo "✅ PM2 configured"
echo ""
echo "Now you can use: ./deploy-to-production.sh \"message\""
echo ""
