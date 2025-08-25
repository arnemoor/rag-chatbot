#!/bin/bash

# Setup script for AutoRAG Framework
# Creates all necessary Cloudflare resources from scratch
set -e

echo "🚀 AutoRAG Framework Setup Script"
echo "================================="

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy examples/.env.basic to .env and configure:"
    echo "  - CLOUDFLARE_ACCOUNT_ID"
    echo "  - CLOUDFLARE_API_TOKEN (see API_TOKEN_SETUP.md)"
    echo "  - AUTORAG_INSTANCE_ID"
    echo "  - R2_BUCKET_NAME"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check prerequisites
command -v npm >/dev/null 2>&1 || { echo "❌ npm not found. Please install Node.js"; exit 1; }

# Validate required environment variables
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$AUTORAG_INSTANCE_ID" ] || [ -z "$R2_BUCKET_NAME" ]; then
    echo "❌ Required environment variables missing in .env"
    echo "Please ensure all required variables are set:"
    echo "  - CLOUDFLARE_ACCOUNT_ID"
    echo "  - CLOUDFLARE_API_TOKEN"
    echo "  - AUTORAG_INSTANCE_ID"
    echo "  - R2_BUCKET_NAME"
    exit 1
fi

echo "✅ Environment configured"
echo "   Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "   AutoRAG Instance: $AUTORAG_INSTANCE_ID"
echo "   R2 Bucket: $R2_BUCKET_NAME"
echo ""

# Step 1: Create R2 Bucket
echo "📦 Creating R2 Bucket..."
cd worker
npx wrangler r2 bucket create "$R2_BUCKET_NAME" 2>/dev/null || {
    echo "⚠️  Bucket might already exist, checking..."
    npx wrangler r2 bucket list | grep -q "$R2_BUCKET_NAME" && echo "✅ Bucket exists" || {
        echo "❌ Failed to create bucket"
        exit 1
    }
}
cd ..

# Step 2: AutoRAG Instance
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "Please create the AutoRAG instance in Cloudflare Dashboard:"
echo "1. Go to: https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/ai/autorag"
echo "2. Click 'Create AutoRAG instance'"
echo "3. Name it: $AUTORAG_INSTANCE_ID"
echo "4. Select R2 bucket: $R2_BUCKET_NAME"
echo "5. Configure indexing settings"
echo "6. Click 'Create'"
echo ""
read -p "Press Enter once you've created the AutoRAG instance..."
echo "✅ AutoRAG instance configured"

# Install Worker dependencies
echo "📦 Installing Worker dependencies..."
cd worker
npm install
cd ..

# Deploy Worker
echo "🔧 Deploying Worker..."
cd worker
wrangler deploy
WORKER_URL=$(wrangler deploy --dry-run 2>&1 | grep -o 'https://[^ ]*workers.dev' | head -1)
cd ..

echo "✅ Worker deployed at: $WORKER_URL"

# Deploy widget to Pages
echo "🌐 Deploying widget to Cloudflare Pages..."
cd widget
npm install
npm run build
npx wrangler pages deploy dist --project-name="autorag-widget" --compatibility-date=2024-01-15
PAGES_URL=$(npx wrangler pages deployment list "autorag-widget" --json 2>/dev/null | grep -o '"url":"[^"]*' | grep -o 'https://[^"]*' | head -1)
cd ..

echo "✅ Widget deployed at: $PAGES_URL"

# Create sample documents
echo "📄 Creating sample documents..."
mkdir -p samples/en samples/de samples/fr samples/it

# English sample
cat > samples/en/guidelines.md << 'EOF'
# Library Catalog Guidelines

## Overview
These guidelines provide comprehensive cataloging protocols for library professionals.

## Classification Standards
- Dewey Decimal System
- Library of Congress Classification
- Universal Decimal Classification

## Cataloging Rules
- Use authorized headings
- Follow AACR2 or RDA standards
- Maintain consistent subject headings

## Quality Control
Regular review of catalog records is recommended for accuracy.
EOF

# German sample
cat > samples/de/richtlinien.md << 'EOF'
# Bibliothekskatalog-Richtlinien

## Übersicht
Diese Richtlinien bieten umfassende Katalogisierungsprotokolle für Bibliotheksfachkräfte.

## Klassifikationsstandards
- Dewey-Dezimalklassifikation
- Library of Congress Klassifikation
- Universelle Dezimalklassifikation

## Katalogisierungsregeln
- Verwenden Sie autorisierte Ansetzungsformen
- Befolgen Sie AACR2 oder RDA Standards
- Pflegen Sie konsistente Schlagwörter

## Qualitätskontrolle
Regelmäßige Überprüfung der Katalogdatensätze wird empfohlen.
EOF

echo "✅ Sample documents created"

# Upload documents to R2
echo "☁️ Uploading documents to R2..."
./scripts/upload-docs.sh

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "Worker URL: $WORKER_URL"
echo "Frontend URL: $PAGES_URL"
echo ""
echo "Next steps:"
echo "1. Add API keys: wrangler secret put OPENAI_API_KEY"
echo "2. Visit the frontend URL to test the chatbot"
echo "3. Check AutoRAG indexing status in Cloudflare Dashboard"