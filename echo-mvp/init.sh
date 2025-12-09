#!/bin/bash

# LifeOS (Echo/Lark) MVP - Development Environment Setup Script
# This script sets up and starts the development environment

set -e  # Exit on error

echo "========================================"
echo "LifeOS Echo MVP - Initialization"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/mastra-backend"
FRONTEND_DIR="$SCRIPT_DIR/expo-app"

echo "Project directory: $SCRIPT_DIR"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v22 ]]; then
    echo -e "${YELLOW}Warning: Expected Node.js v22.x.x, found $NODE_VERSION${NC}"
    echo "Recommended: nvm use 22"
fi
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Kill process on port 3002 if it exists
echo "Checking port 3002..."
if check_port 3002; then
    echo -e "${YELLOW}Port 3002 is in use. Killing existing process...${NC}"
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}Port 3002 is now free${NC}"
else
    echo -e "${GREEN}Port 3002 is available${NC}"
fi
echo ""

# Setup Backend
echo "========================================"
echo "Setting up Backend (mastra-backend)"
echo "========================================"
cd "$BACKEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo -e "${GREEN}Backend dependencies already installed${NC}"
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found in backend directory${NC}"
    echo "Please create a .env file with the following variables:"
    echo "  OPENAI_API_KEY=your_key_here"
    echo "  GMAIL_ACCESS_TOKEN=your_token_here"
    echo "  (and any other required variables)"
    exit 1
else
    echo -e "${GREEN}.env file found${NC}"

    # Check for required environment variables
    if ! grep -q "OPENAI_API_KEY=" .env; then
        echo -e "${YELLOW}Warning: OPENAI_API_KEY not found in .env${NC}"
    fi
fi
echo ""

# Setup Frontend
echo "========================================"
echo "Setting up Frontend (expo-app)"
echo "========================================"
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo -e "${GREEN}Frontend dependencies already installed${NC}"
fi
echo ""

# Start services
echo "========================================"
echo "Starting Services"
echo "========================================"
echo ""

# Start backend in background
echo "Starting backend server on port 3002..."
cd "$BACKEND_DIR"
npm run api > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo "Backend logs: $BACKEND_DIR/backend.log"
echo ""

# Wait for backend to start
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start within 30 seconds${NC}"
        echo "Check logs: $BACKEND_DIR/backend.log"
        exit 1
    fi
    sleep 1
done
echo ""

# Start frontend
echo "Starting frontend (Expo)..."
cd "$FRONTEND_DIR"
echo ""
echo -e "${GREEN}Frontend will open in a new terminal window...${NC}"
echo ""
echo "========================================"
echo "Development Environment Ready!"
echo "========================================"
echo ""
echo -e "${GREEN}Backend:${NC}"
echo "  URL: http://localhost:3002"
echo "  Health: http://localhost:3002/health"
echo "  Logs: $BACKEND_DIR/backend.log"
echo "  PID: $BACKEND_PID"
echo ""
echo -e "${GREEN}Frontend:${NC}"
echo "  Starting Expo dev server..."
echo "  Run 'npx expo start' in the expo-app directory"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Ensure Gmail OAuth token is configured in backend/.env"
echo "  2. Open http://localhost:3002/health to verify backend"
echo "  3. Start Expo: cd $FRONTEND_DIR && npx expo start"
echo "  4. Press 'w' to open in web browser"
echo "  5. Test @mail agent functionality"
echo ""
echo -e "${YELLOW}To stop the backend:${NC}"
echo "  kill $BACKEND_PID"
echo "  or: lsof -ti:3002 | xargs kill -9"
echo ""
echo "========================================"
echo ""

# Start frontend (this will be interactive)
cd "$FRONTEND_DIR"
npx expo start
