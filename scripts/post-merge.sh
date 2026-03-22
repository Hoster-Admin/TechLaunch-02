#!/bin/bash
set -e

# Install admin frontend dependencies and rebuild
echo "Installing admin frontend dependencies..."
cd admin-app/frontend && npm install --prefer-offline 2>/dev/null || npm install
npm run build
cd ../..

# Install backend dependencies if needed
echo "Installing backend dependencies..."
cd admin-app/backend && npm install --prefer-offline 2>/dev/null || true
cd ../..

echo "Post-merge setup complete"
