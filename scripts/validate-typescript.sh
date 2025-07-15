#!/bin/bash

# TypeScript validation script for frontend
# Ensures the entire frontend is written in TypeScript only

echo "🔍 Validating TypeScript-only frontend..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not available"
    echo "💡 Use scripts/validate-typescript-docker.sh for Docker-only validation"
    echo "   or install Node.js to use this script"
    exit 1
fi

echo "✓ npm is available"

# Check for any JavaScript files
JS_FILES=$(find src -name "*.js" -o -name "*.jsx" 2>/dev/null)

if [ -n "$JS_FILES" ]; then
    echo "❌ ERROR: JavaScript files found in TypeScript-only frontend!"
    echo "The following files should be converted to TypeScript:"
    echo "$JS_FILES"
    exit 1
fi

# Check for TypeScript files
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)

if [ "$TS_FILES" -eq 0 ]; then
    echo "❌ ERROR: No TypeScript files found!"
    exit 1
fi

echo "✅ SUCCESS: Found $TS_FILES TypeScript files, no JavaScript files detected"

# Run TypeScript type checking
echo "🔧 Running TypeScript type checking..."
npm run typecheck

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: TypeScript type checking passed"
else
    echo "❌ ERROR: TypeScript type checking failed"
    exit 1
fi

# Test build
echo "🏗️ Testing TypeScript build..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: TypeScript build completed successfully"
    echo "🎉 Frontend is fully TypeScript compliant!"
else
    echo "❌ ERROR: TypeScript build failed"
    exit 1
fi
