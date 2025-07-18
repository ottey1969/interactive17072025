#!/bin/bash

# Sofeia AI Build Script for Render Deployment
set -e

echo "🚀 Starting Sofeia AI build process..."

# Install all dependencies including devDependencies
echo "📦 Installing dependencies..."
npm install --include=dev

# Build the frontend
echo "🔨 Building frontend with Vite..."
npx vite build

# Build the backend
echo "🔧 Building backend with ESBuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"