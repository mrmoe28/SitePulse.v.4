#!/bin/bash
set -e

echo "🚀 Starting Vercel build process..."

# Display environment info
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"

# Check if pnpm is available
if command -v pnpm &> /dev/null; then
    echo "PNPM version: $(pnpm --version)"
    PNPM_AVAILABLE=true
else
    echo "PNPM not available, will use NPM"
    PNPM_AVAILABLE=false
fi

# Function to cleanup on failure
cleanup_on_failure() {
    echo "❌ Build failed, cleaning up..."
    rm -rf node_modules/.cache
    rm -rf .next
    rm -rf apps/web/.next
}

# Set up error trap
trap cleanup_on_failure ERR

# Navigate to the web app directory
cd apps/web

echo "📦 Installing dependencies..."

# Try pnpm first, fallback to npm
if [ "$PNPM_AVAILABLE" = true ]; then
    echo "🏗️ Attempting to install with pnpm..."
    if pnpm install --frozen-lockfile; then
        echo "✅ pnpm install successful"
        BUILD_TOOL="pnpm"
    else
        echo "⚠️ pnpm install failed, falling back to npm..."
        # Clean up pnpm artifacts
        rm -rf node_modules
        rm -rf .pnpm-store
        
        # Generate package-lock.json from pnpm-lock.yaml if needed
        if [ ! -f "package-lock.json" ] && [ -f "../../pnpm-lock.yaml" ]; then
            echo "📝 Converting pnpm-lock.yaml to package-lock.json..."
            npm install --package-lock-only
        fi
        
        if npm ci; then
            echo "✅ npm ci successful"
            BUILD_TOOL="npm"
        else
            echo "❌ Both pnpm and npm failed"
            exit 1
        fi
    fi
else
    echo "🏗️ Installing with npm..."
    if npm ci; then
        echo "✅ npm ci successful"
        BUILD_TOOL="npm"
    else
        echo "❌ npm ci failed"
        exit 1
    fi
fi

echo "🔨 Building application with $BUILD_TOOL..."

# Build the application
if [ "$BUILD_TOOL" = "pnpm" ]; then
    pnpm run build
else
    npm run build
fi

echo "✅ Build completed successfully!"

# Display build info
if [ -d ".next" ]; then
    echo "📊 Build output:"
    du -sh .next
    echo "Total files in .next: $(find .next -type f | wc -l)"
fi

echo "🎉 Vercel build process completed successfully!"