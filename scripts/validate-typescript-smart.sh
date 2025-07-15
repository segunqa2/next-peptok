#!/bin/bash

# Smart TypeScript validation script that automatically chooses the right method
# Detects if Node.js is available and runs either local npm or Docker version

echo "🧠 Smart TypeScript Validation Utility"

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "✓ Node.js/npm detected - using local validation"
    
    # Run local version
    ./scripts/validate-typescript.sh
else
    echo "⚠️  Node.js/npm not found - using Docker validation"
    
    # Run Docker version
    ./scripts/validate-typescript-docker.sh
fi
