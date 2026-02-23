#!/usr/bin/env bash
# Render Build Script: Builds frontend + installs backend deps

echo "=== Installing Frontend Dependencies ==="
cd apps/frontend
npm install

echo "=== Building Frontend ==="
npm run build

echo "=== Installing Backend Dependencies ==="
cd ../backend
npm install

echo "=== Build Complete ==="
