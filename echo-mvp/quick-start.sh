#!/bin/bash

echo "🚀 Echo Email MVP - Quick Start"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "mastra-backend" ] || [ ! -d "expo-app" ]; then
    echo "❌ Error: Run this script from the echo-mvp/ directory"
    exit 1
fi

# Backend setup
echo "📦 Setting up Mastra backend..."
cd mastra-backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file..."
    cp .env.example .env
    echo ""
    echo "📝 IMPORTANT: Edit mastra-backend/.env and add your OPENAI_API_KEY"
    echo "   Get one from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after adding your API key..."
fi

# Start backend in background
echo "🔧 Starting Mastra API server..."
npm run api > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID (logs in backend.log)"

# Wait for backend to start
echo "Waiting for backend..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:3001"
else
    echo "❌ Backend failed to start. Check backend.log for errors"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Frontend setup
cd ../expo-app

if [ ! -d "node_modules" ]; then
    echo "📦 Installing Expo dependencies..."
    npm install
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 Starting Expo app..."
echo ""
echo "Next steps:"
echo "1. Press 'w' to open in web browser"
echo "2. Get Gmail token from: https://developers.google.com/oauthplayground"
echo "3. Paste token into the app"
echo "4. Start chatting with your emails!"
echo ""
echo "To stop: Press Ctrl+C, then run: kill $BACKEND_PID"
echo ""

# Start Expo
npm start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
