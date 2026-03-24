#!/bin/bash
set -e

echo "Installing admin frontend dependencies..."
cd admin-app/frontend && npm install --prefer-offline 2>/dev/null || npm install
npm run build
cd ../..

echo "Installing backend dependencies..."
cd admin-app/backend && npm install --prefer-offline 2>/dev/null || true
cd ../..

echo "Post-merge setup complete"
