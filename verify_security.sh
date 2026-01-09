#!/bin/bash

echo "==================================="
echo "Security Verification Report"
echo "==================================="
echo ""

echo "1. Checking for tracked .env files..."
TRACKED_ENV=$(git ls-files | grep -E '^\.env$' | wc -l)
if [ "$TRACKED_ENV" -eq 0 ]; then
    echo "   ✅ No .env files tracked"
else
    echo "   ❌ WARNING: .env files are tracked!"
fi

echo ""
echo "2. Checking for tracked CSV files..."
TRACKED_CSV=$(git ls-files | grep -E '\.csv$' | wc -l)
if [ "$TRACKED_CSV" -eq 0 ]; then
    echo "   ✅ No CSV files tracked"
else
    echo "   ⚠️  $TRACKED_CSV CSV files found (check if they contain sensitive data)"
    git ls-files | grep -E '\.csv$'
fi

echo ""
echo "3. Checking for hardcoded API keys..."
HARDCODED_KEYS=$(grep -r "AIzaSy\|sk_live\|sk_test\|api_key.*=.*['\"]" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v "process.env" | wc -l)
if [ "$HARDCODED_KEYS" -eq 0 ]; then
    echo "   ✅ No hardcoded API keys found"
else
    echo "   ❌ WARNING: Possible hardcoded API keys detected!"
fi

echo ""
echo "4. Checking .gitignore coverage..."
if grep -q "^\.env$\|^\.env\*" .gitignore && \
   grep -q "^/data/$\|^\*\.csv$" .gitignore && \
   grep -q "^/shared/$" .gitignore; then
    echo "   ✅ .gitignore properly configured"
else
    echo "   ⚠️  .gitignore may need updates"
fi

echo ""
echo "5. Environment variable usage..."
ENV_COUNT=$(grep -r "process\.env\." app/api/ lib/ --include="*.ts" | wc -l)
echo "   ✅ $ENV_COUNT environment variable references found"

echo ""
echo "6. Data directory status..."
if [ -f "data/README.md" ]; then
    echo "   ✅ data/README.md exists (instructions present)"
else
    echo "   ⚠️  data/README.md missing"
fi

echo ""
echo "==================================="
echo "Security Scan Complete"
echo "==================================="
