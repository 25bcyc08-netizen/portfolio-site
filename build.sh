#!/bin/bash
# Build script for Render
echo "Starting build process..."

# Install backend dependencies
cd backend
npm install

# Build frontend (if needed)
cd ../frontend
# No build step needed for static HTML/CSS/JS

echo "Build complete"