#!/usr/bin/env bash
set -euo pipefail
# deploy_directadmin.sh
# Usage (on server after upload/extract):
#   bash deploy_directadmin.sh /path/to/app-root
# The script installs dependencies, builds, and starts the app with pm2 using ecosystem.config.js

APP_DIR="$1"
if [ -z "$APP_DIR" ]; then
  echo "Usage: $0 /absolute/path/to/app-root"
  exit 2
fi

cd "$APP_DIR"

echo "Installing dependencies (use --production if you want to skip dev deps)..."
npm ci --silent

echo "Building Next.js app..."
npm run build

echo "Starting/Reloading app with PM2..."
# Start or reload via pm2 ecosystem file if present
if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload ecosystem.config.js --update-env
else
  echo "pm2 not found. Installing pm2 globally..."
  npm install -g pm2
  pm2 startOrReload ecosystem.config.js --update-env
fi

echo "Deployment complete. Use 'pm2 status' to verify the process."
