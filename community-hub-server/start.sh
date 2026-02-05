#!/bin/bash

# Start script for Community Hub Server
# This script handles initial setup and starts the server

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Accelanova Community Hub - Startup Script           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Created .env file. Please edit it with your settings."
        echo ""
        echo "Press Enter to continue or Ctrl+C to exit and edit .env first..."
        read
    else
        echo "✗ .env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ npm install failed"
        exit 1
    fi
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if database exists
if [ ! -f data/hub.db ]; then
    echo "🗄️  Database not found. Running migrations..."
    npm run migrate
    if [ $? -ne 0 ]; then
        echo "✗ Migration failed"
        exit 1
    fi
    echo "✓ Database created"
    echo ""
    
    echo "🌱 Seeding database with initial data..."
    npm run seed
    if [ $? -ne 0 ]; then
        echo "✗ Seeding failed"
        exit 1
    fi
    echo "✓ Database seeded"
    echo ""
else
    echo "✓ Database exists"
    echo ""
fi

# Start the server
echo "🚀 Starting Community Hub Server..."
echo ""

npm start




