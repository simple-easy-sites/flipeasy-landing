#!/bin/bash

echo "🚀 FlipEasy Setup Verification"
echo "=============================="

# Check Node.js version
echo "📦 Checking Node.js version..."
node --version

# Check if dependencies are installed
echo "📋 Checking dependencies..."
if [ -f "package-lock.json" ] || [ -f "pnpm-lock.yaml" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed - run 'npm install'"
fi

# Check environment variables
echo "🔑 Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "✅ Environment file exists"
    if grep -q "GEMINI_API_KEY" .env.local; then
        echo "✅ Gemini API key configured"
    else
        echo "❌ Gemini API key missing"
    fi
else
    echo "❌ .env.local file missing"
fi

# Check key files
echo "📁 Checking key files..."
files=(
    "app/page.tsx"
    "app/create/page.tsx" 
    "app/api/analyze/route.ts"
    "components/ui/button.tsx"
    "lib/utils.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎯 Ready to start?"
echo "Run: npm run dev"
echo "Then visit: http://localhost:3000"
echo ""
echo "📱 For mobile testing:"
echo "1. Make sure you're on HTTPS (required for camera)"
echo "2. Test on real devices, not just browser dev tools"
echo "3. Check that camera permissions are granted"
echo ""
echo "🔧 If you see errors:"
echo "1. Check the console for API errors"
echo "2. Verify your Gemini API key is valid"
echo "3. Make sure images are under 10MB"
echo ""
echo "Happy selling! 💰"
