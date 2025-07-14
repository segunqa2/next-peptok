#!/bin/bash
echo "Checking for remaining api imports..."
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l '"@/services/api"' 2>/dev/null | grep -v apiEnhanced
