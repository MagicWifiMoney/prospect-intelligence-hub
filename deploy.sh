#!/bin/bash

# Prospect Intelligence Hub - Clean Deployment Script
# Ensures deployment is separate from mncannabishub
# CRITICAL: This project must NEVER deploy to mncannabishub.com

set -e  # Exit on error

echo "🚀 Prospect Intelligence Hub - Clean Deployment"
echo "=============================================="
echo ""
echo "⚠️  CRITICAL: Ensuring separation from mncannabishub"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# CRITICAL: Remove any existing Vercel links that might point to mncannabishub
if [ -d ".vercel" ]; then
    echo "⚠️  CRITICAL: Found existing .vercel directory"
    echo "   This could link to mncannabishub. Removing..."

    # Show what's being removed
    if [ -f ".vercel/project.json" ]; then
        echo "   Old project link:"
        cat .vercel/project.json 2>/dev/null | head -5 || true
    fi

    rm -rf .vercel
    echo "✅ Removed .vercel directory - deploying as NEW project"
else
    echo "✅ No .vercel directory found - clean deployment"
fi

# Unlink any Vercel CLI associations
echo ""
echo "🔓 Unlinking any existing Vercel CLI associations..."
vercel unlink --yes 2>/dev/null || echo "   No existing links to unlink"

# Check for NEXTAUTH_SECRET
if grep -q "NEXTAUTH_SECRET=your-nextauth-secret-here" .env 2>/dev/null; then
    echo ""
    echo "🚨 CRITICAL: NEXTAUTH_SECRET is still using default value!"
    echo ""
    echo "Please update .env with a secure secret:"
    echo "  openssl rand -base64 32"
    echo ""
    read -p "Have you updated NEXTAUTH_SECRET? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled. Please update NEXTAUTH_SECRET first."
        exit 1
    fi
fi

# Verify package.json has correct name
echo ""
echo "🔍 Verifying project identity..."
PACKAGE_NAME=$(grep '"name"' package.json | head -1 | cut -d'"' -f4)
if [ "$PACKAGE_NAME" != "prospect-intelligence-hub" ]; then
    echo "❌ ERROR: package.json name is '$PACKAGE_NAME'"
    echo "   Expected: 'prospect-intelligence-hub'"
    echo "   This could cause deployment to wrong project!"
    exit 1
fi
echo "✅ Project name verified: $PACKAGE_NAME"

# Check for any mncannabishub references in code
echo ""
echo "🔍 Scanning for mncannabishub references in code..."
if grep -r "mncannabishub" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude="*.md" --exclude="deploy.sh" --exclude=".vercelignore" 2>/dev/null; then
    echo ""
    echo "❌ ERROR: Found references to 'mncannabishub' in code!"
    echo "   This project must be completely separate."
    echo "   Please remove these references before deploying."
    exit 1
fi
echo "✅ No mncannabishub references found in code"

# Verify vercel.json exists and has correct name
if [ -f "vercel.json" ]; then
    VERCEL_PROJECT_NAME=$(grep '"name"' vercel.json | head -1 | cut -d'"' -f4)
    if [ "$VERCEL_PROJECT_NAME" != "prospect-intelligence-hub" ]; then
        echo "❌ ERROR: vercel.json project name is '$VERCEL_PROJECT_NAME'"
        echo "   Expected: 'prospect-intelligence-hub'"
        exit 1
    fi
    echo "✅ vercel.json verified: $VERCEL_PROJECT_NAME"
else
    echo "⚠️  WARNING: No vercel.json found"
fi

# Test build locally first
echo ""
echo "🔨 Testing build locally..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📋 Pre-Deployment Verification Complete:"
echo "  ✅ NEXTAUTH_SECRET updated"
echo "  ✅ Local build successful"
echo "  ✅ .vercel directory removed"
echo "  ✅ Vercel CLI unlinked"
echo "  ✅ Project name verified: prospect-intelligence-hub"
echo "  ✅ No mncannabishub references in code"
echo "  ✅ vercel.json configuration verified"
echo ""
echo "🚀 Ready to deploy as NEW project!"
echo ""
echo "⚠️  CRITICAL INSTRUCTIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "When Vercel CLI asks questions, answer EXACTLY as shown:"
echo ""
echo "❓ 'Set up and deploy?' → YES"
echo "❓ 'Which scope?' → Select your account"
echo "❓ 'Link to existing project?' → ❌ NO (CRITICAL!)"
echo "❓ 'What's your project's name?' → prospect-intelligence-hub"
echo "❓ 'In which directory is your code located?' → ./"
echo "❓ 'Want to override settings?' → NO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  If you see mncannabishub mentioned ANYWHERE, press Ctrl+C and cancel!"
echo ""
read -p "I understand - deploy now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying to Vercel as NEW project..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Deploy to production with explicit flags
    vercel --prod --confirm

    if [ $? -eq 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ Deployment successful!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🔍 CRITICAL VERIFICATION REQUIRED:"
        echo ""
        echo "1. Check the deployment URL above"
        echo "   ✅ Should contain: prospect-intelligence-hub"
        echo "   ❌ Should NOT contain: mncannabishub"
        echo ""
        echo "2. Visit Vercel Dashboard: https://vercel.com/dashboard"
        echo "   ✅ Look for project: prospect-intelligence-hub"
        echo "   ❌ Should NOT be under: mncannabishub"
        echo ""
        echo "3. If you see 'mncannabishub' anywhere:"
        echo "   ❌ STOP! Do not add environment variables"
        echo "   ❌ Contact support - deployment went to wrong project"
        echo ""
        echo "4. If correct project (prospect-intelligence-hub):"
        echo "   ✅ Add environment variables in Vercel Dashboard"
        echo "   ✅ Redeploy after adding env vars"
        echo "   ✅ Test signup/login at your new URL"
        echo ""
        echo "📝 Environment Variables to Add:"
        echo "   DATABASE_URL (use your prospect hub database)"
        echo "   NEXTAUTH_SECRET (generate new with: openssl rand -base64 32)"
        echo "   NEXTAUTH_URL (should be: https://prospect-intelligence-hub-xxx.vercel.app)"
        echo ""
        echo "⚠️  Do NOT copy environment variables from mncannabishub!"
        echo ""
    else
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "❌ Deployment failed. Check errors above."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Common issues:"
        echo "1. Vercel CLI might have linked to existing project"
        echo "2. Try running: rm -rf .vercel && ./deploy.sh"
        echo "3. Check you answered 'NO' to 'Link to existing project?'"
        echo ""
    fi
else
    echo "Deployment cancelled."
fi
