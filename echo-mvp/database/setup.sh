#!/bin/bash

# Neon Database Setup Script
# ===========================
# Applies schema.sql to your Neon PostgreSQL database

set -e

echo "=================================================="
echo "  LIFEOS NEON DATABASE SETUP"
echo "=================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set"
    echo ""
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://neondb_owner:npg_JiIY5sDx6GBP@ep-curly-meadow-a9of4iv6-pooler.gwc.azure.neon.tech/neondb?sslmode=require'"
    echo ""
    echo "Or create a .env file in the database directory"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql (PostgreSQL client) not found"
    echo ""
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    exit 1
fi

echo "Database URL: ${DATABASE_URL:0:50}..."
echo ""
echo "This will:"
echo "  1. Create all tables (users, messages, agent_state, etc.)"
echo "  2. Create indexes for performance"
echo "  3. Set up triggers for auto-timestamps"
echo "  4. Add a test user (test@lifeos.dev / password123)"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

echo ""
echo "Applying schema..."
echo ""

# Apply schema
psql "$DATABASE_URL" -f schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "  DATABASE SETUP COMPLETE!"
    echo "=================================================="
    echo ""
    echo "Tables created:"
    echo "  ✓ users"
    echo "  ✓ messages"
    echo "  ✓ agent_state"
    echo "  ✓ sessions"
    echo "  ✓ email_cache"
    echo "  ✓ calendar_events"
    echo "  ✓ memory_items"
    echo ""
    echo "Test user created:"
    echo "  Email: test@lifeos.dev"
    echo "  Password: password123"
    echo ""
    echo "You can now start the backend:"
    echo "  cd ../mastra-backend"
    echo "  npm install"
    echo "  npm run api"
    echo ""
else
    echo ""
    echo "ERROR: Schema application failed"
    exit 1
fi
