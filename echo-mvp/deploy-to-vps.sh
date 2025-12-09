#!/bin/bash

# LifeOS VPS Deployment Script
# ==============================
# Deploy the Mastra backend to your own VPS

set -e

echo "=================================================="
echo "  LIFEOS VPS DEPLOYMENT"
echo "=================================================="
echo ""

# Configuration
VPS_HOST="${VPS_HOST:-your-vps-ip-or-domain}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/lifeos}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
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

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    # Check if VPS host is set
    if [ "$VPS_HOST" = "your-vps-ip-or-domain" ]; then
        error "VPS_HOST not set. Set it with: export VPS_HOST=your.vps.com"
    fi

    # Check SSH connection
    if ! ssh -p "$VPS_PORT" -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'SSH OK'" &> /dev/null; then
        error "Cannot connect to VPS via SSH. Check VPS_HOST, VPS_USER, and SSH keys."
    fi

    success "Prerequisites check passed"
}

# Build the application
build_app() {
    echo ""
    echo "Building application..."
    cd mastra-backend

    # Install dependencies
    npm install

    # Build TypeScript
    npm run build

    success "Application built successfully"
    cd ..
}

# Create deployment package
create_package() {
    echo ""
    echo "Creating deployment package..."

    # Create temp directory
    TEMP_DIR=$(mktemp -d)

    # Copy necessary files
    cp -r mastra-backend/dist "$TEMP_DIR/"
    cp -r mastra-backend/node_modules "$TEMP_DIR/"
    cp mastra-backend/package.json "$TEMP_DIR/"
    cp mastra-backend/.env "$TEMP_DIR/.env.production"

    # Create tarball
    tar -czf lifeos-backend.tar.gz -C "$TEMP_DIR" .

    # Cleanup
    rm -rf "$TEMP_DIR"

    success "Deployment package created: lifeos-backend.tar.gz"
}

# Upload to VPS
upload_to_vps() {
    echo ""
    echo "Uploading to VPS..."

    # Create directory on VPS
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "mkdir -p $DEPLOY_DIR"

    # Upload package
    scp -P "$VPS_PORT" lifeos-backend.tar.gz "$VPS_USER@$VPS_HOST:$DEPLOY_DIR/"

    # Extract on VPS
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "cd $DEPLOY_DIR && tar -xzf lifeos-backend.tar.gz && rm lifeos-backend.tar.gz"

    # Cleanup local package
    rm lifeos-backend.tar.gz

    success "Files uploaded to VPS"
}

# Install Node.js on VPS (if needed)
install_nodejs_on_vps() {
    echo ""
    echo "Checking Node.js on VPS..."

    if ! ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "command -v node" &> /dev/null; then
        warning "Node.js not found on VPS. Installing..."

        ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << 'ENDSSH'
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
ENDSSH

        success "Node.js installed on VPS"
    else
        success "Node.js already installed on VPS"
    fi
}

# Set up systemd service
setup_systemd_service() {
    echo ""
    echo "Setting up systemd service..."

    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << ENDSSH
# Create systemd service file
cat > /etc/systemd/system/lifeos.service << 'EOF'
[Unit]
Description=LifeOS Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_DIR
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/api/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=lifeos

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable lifeos

# Start service
systemctl restart lifeos

# Check status
systemctl status lifeos --no-pager
ENDSSH

    success "Systemd service configured and started"
}

# Set up Nginx reverse proxy
setup_nginx() {
    echo ""
    echo "Setting up Nginx reverse proxy..."

    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << ENDSSH
# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Create Nginx config
cat > /etc/nginx/sites-available/lifeos << 'EOF'
server {
    listen 80;
    server_name $VPS_HOST;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/lifeos /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
ENDSSH

    success "Nginx configured as reverse proxy"
}

# Main deployment flow
main() {
    echo "VPS: $VPS_USER@$VPS_HOST:$VPS_PORT"
    echo "Deploy directory: $DEPLOY_DIR"
    echo ""
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi

    check_prerequisites
    build_app
    create_package
    upload_to_vps
    install_nodejs_on_vps
    setup_systemd_service
    setup_nginx

    echo ""
    echo "=================================================="
    echo "  DEPLOYMENT COMPLETE!"
    echo "=================================================="
    echo ""
    success "Backend is now running at: http://$VPS_HOST"
    echo ""
    echo "Useful commands:"
    echo "  Check status:  ssh $VPS_USER@$VPS_HOST 'systemctl status lifeos'"
    echo "  View logs:     ssh $VPS_USER@$VPS_HOST 'journalctl -u lifeos -f'"
    echo "  Restart:       ssh $VPS_USER@$VPS_HOST 'systemctl restart lifeos'"
    echo ""
}

# Run main
main
