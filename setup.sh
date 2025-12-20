#!/bin/bash

# GroupTherapy Records - Setup Script
# This script helps with the initial setup of the development environment

set -e

echo "================================"
echo "GroupTherapy Records Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << 'EOF'
# Spotify API
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
VITE_SPOTIFY_CLIENT_ID=
VITE_SPOTIFY_CLIENT_SECRET=

# Gemini AI
VITE_GEMINI_API_KEY=
VITE_GEMINI_PROJECT_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# Firebase
DATABASE_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Admin Credentials
ADMIN_PASSWORD=
ADMIN_EMAIL=

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
EOF
    echo "✅ Created .env file. Please fill in your API credentials."
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys before continuing."
    echo ""
    read -p "Press Enter after you've filled in the .env file..."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed successfully!"

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Make sure all environment variables in .env are filled"
echo "2. Run the database migrations in Supabase (see docs/migration-new-tables.sql)"
echo "3. Configure Cloudinary upload preset"
echo "4. Start the development server: npm run dev"
echo ""
echo "For more information, see README.md"
echo ""
