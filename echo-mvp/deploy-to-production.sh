#!/bin/bash

# Deploy to Production Script
# ============================
# Commits changes, pushes to GitHub, and deploys to VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "=================================================="
echo "  LIFEOS DEPLOY TO PRODUCTION"
echo "=================================================="
echo ""

# Check if commit message provided
if [ -z "$1" ]; then
    error "Please provide a commit message: ./deploy-to-production.sh \"your message\""
fi

COMMIT_MSG="$1"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "Changes detected. Proceeding with deployment..."
else
    warning "No changes to commit. Skipping Git operations."
    read -p "Deploy anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Show what will be committed
echo ""
echo "Files to be committed:"
git status --short
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Git operations
echo ""
echo "Step 1: Committing changes..."
git add .
git commit -m "$COMMIT_MSG" || warning "Nothing to commit"
success "Changes committed"

echo ""
echo "Step 2: Pushing to GitHub..."
git push origin main
success "Pushed to GitHub"

# Deploy to VPS
echo ""
echo "Step 3: Deploying to VPS..."
echo ""

# Run deployment on VPS
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 << 'ENDSSH'
cd /var/www/lifeos-repo

# Pull latest
echo "Pulling latest code..."
git pull origin main

# Install dependencies
cd mastra-backend
echo "Installing dependencies..."
npm ci --production

# Build
echo "Building application..."
npm run build

# Restart PM2
echo "Restarting PM2 process..."
pm2 restart lifeos-api

# Show status
pm2 list | grep lifeos-api
ENDSSH

success "Deployed to VPS"

echo ""
echo "=================================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "✅ Code committed and pushed to GitHub"
echo "✅ VPS updated and restarted"
echo ""
echo "Check status:"
echo "  sshpass -p 'VeloF@2025@@' ssh root@72.60.17.245 'pm2 logs lifeos-api'"
echo ""
