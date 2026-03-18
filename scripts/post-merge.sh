#!/bin/bash
set -e

echo "==> Installing backend dependencies..."
cd backend && npm install --legacy-peer-deps 2>&1 && cd ..

echo "==> Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps 2>&1 && cd ..

echo "==> Building frontend..."
cd frontend && npm run build 2>&1 && cd ..

echo "==> Post-merge setup complete."
