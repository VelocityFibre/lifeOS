#!/bin/bash

# LifeOS Backend - Railway Deployment Script
# This script helps you deploy the backend to Railway

set -e

echo "🚀 LifeOS Backend - Railway Deployment"
echo "======================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found."
    echo ""
    echo "📥 Install with: npm install -g @railway/cli"
    echo "   Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway:"
    railway login
fi

echo "✅ Railway authentication confirmed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Please create .env with your configuration."
    exit 1
fi

echo "✅ .env file found"
echo ""

# Load environment variables
echo "📋 Setting Railway environment variables..."
echo ""

# Read .env and set variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue

    # Remove any quotes from value
    value="${value%\"}"
    value="${value#\"}"

    # Skip empty values
    [[ -z $value ]] && continue

    echo "   Setting: $key"
    railway variables set "$key=$value" 2>/dev/null || echo "   ⚠️  Could not set $key"
done < .env

echo ""
echo "✅ Environment variables configured"
echo ""

# Set production-specific variables
echo "🔧 Setting production environment..."
railway variables set NODE_ENV=production
railway variables set API_PORT=3001

echo ""
echo "📦 Deploying to Railway..."
echo ""

# Deploy
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Your backend is now live at:"
railway domain
echo ""
echo "📊 To view logs:"
echo "   railway logs"
echo ""
echo "🌐 To open the Railway dashboard:"
echo "   railway open"
echo ""
