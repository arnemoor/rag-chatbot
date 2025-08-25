#!/bin/bash

# Simple test script to diagnose deployment issues

echo "Testing Cloudflare deployment prerequisites..."
echo "=============================================="

# Load .env
if [ -f ".env" ]; then
    set -a  # Enable automatic export of all variables
    source .env
    set +a  # Disable automatic export
    echo "✓ .env file loaded"
else
    echo "✗ .env file not found"
    exit 1
fi

# Check environment variables
echo ""
echo "Environment Variables:"
echo "- CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:0:10}..."
echo "- CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo "- AUTORAG_INSTANCE_ID: $AUTORAG_INSTANCE_ID"
echo "- R2_BUCKET_NAME: $R2_BUCKET_NAME"

# Test wrangler authentication
echo ""
echo "Testing wrangler authentication..."
cd worker
npx wrangler whoami

# List R2 buckets
echo ""
echo "Listing R2 buckets..."
npx wrangler r2 bucket list

# Try a dry run deployment
echo ""
echo "Testing deployment (dry run)..."
npx wrangler deploy --dry-run

echo ""
echo "If all tests passed, run ./scripts/deploy.sh to deploy for real"