#!/bin/bash

# AutoRAG Open Source Deployment Script
# This script deploys the AutoRAG system to YOUR Cloudflare infrastructure
# All URLs are automatically configured based on YOUR deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_step() { echo -e "${BLUE}→ $1${NC}"; }

echo "================================================"
echo "   🚀 AutoRAG Open Source Deployment"
echo "================================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Step 1: Check for .env file
print_step "Checking configuration..."
if [ ! -f ".env" ]; then
    if [ -f "examples/.env.basic" ]; then
        print_info "Creating .env from examples/.env.basic"
        cp examples/.env.basic .env
        print_error ".env file created. Please edit it with your Cloudflare credentials:"
        echo ""
        echo "  1. Open .env in your editor"
        echo "  2. Add your CLOUDFLARE_ACCOUNT_ID"
        echo "  3. Add your CLOUDFLARE_API_TOKEN"
        echo "  4. Add your AUTORAG_INSTANCE_ID"
        echo "  5. Run this script again"
        echo ""
        echo "See API_TOKEN_SETUP.md for detailed instructions"
        exit 1
    else
        print_error "No .env or examples/.env.basic file found!"
        exit 1
    fi
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    print_error "CLOUDFLARE_ACCOUNT_ID not set in .env"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "CLOUDFLARE_API_TOKEN not set in .env"
    exit 1
fi

# Set defaults
WORKER_NAME="${WORKER_NAME:-autorag-worker}"
PAGES_PROJECT="${PAGES_PROJECT:-autorag-widget}"
R2_BUCKET="${R2_BUCKET:-autorag-docs}"
AUTORAG_INSTANCE="${AUTORAG_INSTANCE_ID:-autorag-instance}"

print_success "Configuration loaded"
echo "  Account ID: ${CLOUDFLARE_ACCOUNT_ID:0:8}..."
echo "  Worker Name: $WORKER_NAME"
echo "  Pages Project: $PAGES_PROJECT"
echo "  R2 Bucket: $R2_BUCKET"
echo ""

# Step 2: Deploy Worker
print_step "Deploying Worker API..."
cd "$PROJECT_ROOT/worker"

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing worker dependencies..."
    npm install --silent
fi

# Check if wrangler is available
if ! command -v wrangler &> /dev/null && ! npx wrangler --version &> /dev/null; then
    print_error "wrangler CLI not found. Please run ./scripts/install-dependencies.sh first"
    exit 1
fi

# Configure wrangler.toml from template (always regenerate)
if [ -f "wrangler.toml.template" ]; then
    print_info "Generating wrangler.toml from template..."
    sed -e "s/{{WORKER_NAME}}/$WORKER_NAME/g" \
        -e "s/{{CLOUDFLARE_ACCOUNT_ID}}/$CLOUDFLARE_ACCOUNT_ID/g" \
        -e "s/{{AUTORAG_INSTANCE_ID}}/$AUTORAG_INSTANCE_ID/g" \
        -e "s/{{AI_GATEWAY_NAME}}/autorag-gateway/g" \
        -e "s/{{R2_BUCKET_NAME}}/$R2_BUCKET/g" \
        wrangler.toml.template > wrangler.toml
    print_success "Worker configuration generated"
else
    print_error "wrangler.toml.template not found!"
    exit 1
fi

# Deploy worker
print_info "Running wrangler deploy (this may take a moment)..."
WORKER_OUTPUT=$(npx wrangler deploy 2>&1) || {
    print_error "Worker deployment failed:"
    echo "$WORKER_OUTPUT"
    exit 1
}

# Extract Worker URL
WORKER_URL=$(echo "$WORKER_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1)

if [ -z "$WORKER_URL" ]; then
    print_error "Failed to extract Worker URL from deployment output"
    echo "Deployment output:"
    echo "$WORKER_OUTPUT"
    exit 1
fi

print_success "Worker deployed: $WORKER_URL"

# Step 3: Generate configuration files
print_step "Generating configuration files..."
cd "$PROJECT_ROOT"

DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Generate deployment-config.json
if [ -f "deployment-config.json.template" ]; then
    sed -e "s|{{WORKER_URL}}|$WORKER_URL|g" \
        -e "s|{{WIDGET_URL}}|pending|g" \
        -e "s|{{DEPLOYED_AT}}|$DEPLOYED_AT|g" \
        -e "s|{{ACCOUNT_ID}}|$CLOUDFLARE_ACCOUNT_ID|g" \
        -e "s|{{WORKER_NAME}}|$WORKER_NAME|g" \
        -e "s|{{PAGES_PROJECT}}|$PAGES_PROJECT|g" \
        deployment-config.json.template > deployment-config.json
else
    cat > deployment-config.json << EOF
{
  "worker_url": "$WORKER_URL",
  "widget_url": "pending",
  "deployed_at": "$DEPLOYED_AT",
  "environment": {
    "account_id": "$CLOUDFLARE_ACCOUNT_ID",
    "worker_name": "$WORKER_NAME",
    "pages_project": "$PAGES_PROJECT"
  }
}
EOF
fi

print_success "Generated deployment-config.json"

# Step 4: Build Widget
print_step "Building widget..."
cd "$PROJECT_ROOT/widget"

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing widget dependencies..."
    npm install --silent
fi

# Generate wrangler.toml from template if needed
if [ -f "wrangler.toml.template" ]; then
    print_info "Generating widget wrangler.toml from template..."
    sed -e "s/{{PAGES_PROJECT_NAME}}/$PAGES_PROJECT/g" \
        wrangler.toml.template > wrangler.toml
fi

# Generate config.js from template
if [ -f "src/config.js.template" ]; then
    sed -e "s|{{WORKER_URL}}|$WORKER_URL|g" \
        -e "s|{{WIDGET_URL}}|pending|g" \
        -e "s|{{DEPLOYED_AT}}|$DEPLOYED_AT|g" \
        src/config.js.template > src/config.js
    print_success "Generated widget/src/config.js"
else
    # Create config.js directly if no template
    cat > src/config.js << EOF
// AutoRAG Widget Configuration
// Auto-generated during deployment - DO NOT EDIT

export const DEPLOYMENT_CONFIG = {
  worker_url: '$WORKER_URL',
  widget_url: 'pending',
  deployed_at: '$DEPLOYED_AT'
};

export const WORKER_URL = DEPLOYMENT_CONFIG.worker_url;
export const WIDGET_URL = DEPLOYMENT_CONFIG.widget_url;
EOF
fi

# Build widget
npm run build

# Copy deployment config to dist
cp ../deployment-config.json dist/

print_success "Widget built"

# Step 5: Deploy Widget to Pages
print_step "Deploying widget to Cloudflare Pages..."

# Create Pages project if it doesn't exist
npx wrangler pages project create "$PAGES_PROJECT" --production-branch=main 2>/dev/null || true

# Deploy to Pages
PAGES_OUTPUT=$(npx wrangler pages deploy dist --project-name="$PAGES_PROJECT" --commit-dirty=true 2>&1)

# Extract Widget URL (try alias first, then deployment URL)
WIDGET_URL=$(echo "$PAGES_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.pages\.dev' | grep -v '^https://[a-f0-9]' | head -1)
if [ -z "$WIDGET_URL" ]; then
    WIDGET_URL=$(echo "$PAGES_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.pages\.dev' | head -1)
fi

if [ -z "$WIDGET_URL" ]; then
    print_error "Failed to deploy Widget or extract URL"
    echo "$PAGES_OUTPUT"
    exit 1
fi

print_success "Widget deployed: $WIDGET_URL"

# Step 6: Update configuration with final URLs
print_step "Updating configuration with final URLs..."
cd "$PROJECT_ROOT"

# Update deployment-config.json
if [ -f "deployment-config.json.template" ]; then
    sed -e "s|{{WORKER_URL}}|$WORKER_URL|g" \
        -e "s|{{WIDGET_URL}}|$WIDGET_URL|g" \
        -e "s|{{DEPLOYED_AT}}|$DEPLOYED_AT|g" \
        -e "s|{{ACCOUNT_ID}}|$CLOUDFLARE_ACCOUNT_ID|g" \
        -e "s|{{WORKER_NAME}}|$WORKER_NAME|g" \
        -e "s|{{PAGES_PROJECT}}|$PAGES_PROJECT|g" \
        deployment-config.json.template > deployment-config.json
else
    cat > deployment-config.json << EOF
{
  "worker_url": "$WORKER_URL",
  "widget_url": "$WIDGET_URL",
  "deployed_at": "$DEPLOYED_AT",
  "environment": {
    "account_id": "$CLOUDFLARE_ACCOUNT_ID",
    "worker_name": "$WORKER_NAME",
    "pages_project": "$PAGES_PROJECT"
  }
}
EOF
fi

# Update widget config with final URLs
cd "$PROJECT_ROOT/widget"
if [ -f "src/config.js.template" ]; then
    sed -e "s|{{WORKER_URL}}|$WORKER_URL|g" \
        -e "s|{{WIDGET_URL}}|$WIDGET_URL|g" \
        -e "s|{{DEPLOYED_AT}}|$DEPLOYED_AT|g" \
        src/config.js.template > src/config.js
else
    cat > src/config.js << EOF
// AutoRAG Widget Configuration
// Auto-generated during deployment - DO NOT EDIT

export const DEPLOYMENT_CONFIG = {
  worker_url: '$WORKER_URL',
  widget_url: '$WIDGET_URL',
  deployed_at: '$DEPLOYED_AT'
};

export const WORKER_URL = DEPLOYMENT_CONFIG.worker_url;
export const WIDGET_URL = DEPLOYMENT_CONFIG.widget_url;
EOF
fi

# Rebuild and redeploy with final configuration
print_info "Rebuilding widget with final configuration..."
npm run build
cp ../deployment-config.json dist/
npx wrangler pages deploy dist --project-name="$PAGES_PROJECT" --commit-dirty=true >/dev/null 2>&1

print_success "Configuration updated"

# Step 7: Upload sample documents (optional)
if [ -d "$PROJECT_ROOT/sample-documents" ] && [ "$SKIP_DOCUMENTS" != "true" ]; then
    print_step "Uploading sample documents..."
    if [ -f "$SCRIPT_DIR/upload-library-documents.sh" ]; then
        "$SCRIPT_DIR/upload-library-documents.sh"
    else
        print_info "Document upload script not found, skipping..."
    fi
fi

# Step 8: Summary
echo ""
echo "================================================"
echo "   ✨ Deployment Complete!"
echo "================================================"
echo ""
echo "🔗 Your URLs:"
echo "  Worker API: $WORKER_URL"
echo "  Widget: $WIDGET_URL"
echo ""
echo "📋 Integration Code:"
echo ""
echo "  <script src=\"$WIDGET_URL/autorag-widget.min.js\"></script>"
echo "  <autorag-widget></autorag-widget>"
echo ""
echo "🎯 Quick Links:"
echo "  Chat Interface: $WIDGET_URL"
echo "  Playground: $WIDGET_URL/playground"
echo "  R2 Browser: $WIDGET_URL/r2browser"
echo "  Demo: $WIDGET_URL/demo"
echo ""
echo "📚 Configuration saved to:"
echo "  - deployment-config.json"
echo "  - widget/src/config.js"
echo ""
echo "🚀 Your AutoRAG system is ready!"
echo ""
echo "Need help? Check the documentation in ./documentation/"