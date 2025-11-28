#!/bin/bash

# Deployment script for livebaz.com
# Run this script on your GCP instance after initial setup

set -e  # Exit on error

echo "🚀 Starting deployment for livebaz.com..."

# Variables
APP_DIR="/home/$USER/apps/cpcl"
FRONTEND_DIR="$APP_DIR/Frontend"
BACKEND_DIR="$APP_DIR/server"

# Update code
echo "📥 Pulling latest changes..."
cd $APP_DIR
git pull origin main  # Change 'main' to your branch name if different

# Update backend
echo "🔧 Updating backend..."
cd $BACKEND_DIR
npm install
pm2 restart cpcl-backend || pm2 start npm --name "cpcl-backend" -- run dev

# Update frontend
echo "🎨 Building frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Show status
echo "✅ Deployment complete!"
echo ""
echo "Status:"
pm2 status
echo ""
echo "🌐 Visit: https://livebaz.com"
