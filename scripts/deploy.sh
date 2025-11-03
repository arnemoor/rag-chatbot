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

# Load environment variables and export them for child processes
set -a  # Enable automatic export of all variables
source .env
set +a  # Disable automatic export

# Validate required variables
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    print_error "CLOUDFLARE_ACCOUNT_ID not set in .env"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "CLOUDFLARE_API_TOKEN not set in .env"
    exit 1
fi

# Set defaults - use PAGES_PROJECT_NAME as the standard
WORKER_NAME="${WORKER_NAME:-autorag-worker}"
PAGES_PROJECT="${PAGES_PROJECT_NAME:-autorag-widget}"
R2_BUCKET="${R2_BUCKET_NAME:-autorag-docs}"
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
if ! command -v wrangler &> /dev/null && ! npx --yes wrangler --version &> /dev/null; then
    print_error "wrangler CLI not found. Please run ./scripts/install-dependencies.sh first"
    exit 1
fi

# Configure wrangler.toml from template (always regenerate)
if [ -f "wrangler.toml.template" ]; then
    print_info "Generating wrangler.toml from template..."
    sed -e "s/{{WORKER_NAME}}/$WORKER_NAME/g" \
        -e "s/{{CLOUDFLARE_ACCOUNT_ID}}/$CLOUDFLARE_ACCOUNT_ID/g" \
        -e "s/{{AUTORAG_INSTANCE_ID}}/$AUTORAG_INSTANCE_ID/g" \
        -e "s/{{AI_GATEWAY_NAME}}/${AI_GATEWAY_NAME:-autorag-gateway}/g" \
        -e "s/{{R2_BUCKET_NAME}}/$R2_BUCKET/g" \
        wrangler.toml.template > wrangler.toml
    print_success "Worker configuration generated"
else
    print_error "wrangler.toml.template not found!"
    exit 1
fi

# Deploy worker
# Note: --env="" explicitly selects the top-level environment (not production)
# This avoids the "Multiple environments" warning from wrangler
print_info "Running wrangler deploy (this may take a moment)..."
WORKER_OUTPUT=$(npx --yes wrangler deploy --env="" 2>&1) || {
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

# Step 2.5: Configure API secrets if available
print_step "Configuring API secrets..."

# Check and set Cloudflare API token (needed for AutoRAG sync)
if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_info "Setting Cloudflare API token for Worker runtime..."
    # Store token in a temp variable since wrangler needs CLOUDFLARE_API_TOKEN env var for auth
    TOKEN_VALUE="$CLOUDFLARE_API_TOKEN"
    echo "$TOKEN_VALUE" | npx --yes wrangler secret put CLOUDFLARE_API_TOKEN --env="" 2>&1 | grep -v "Creating the secret for the Worker" || true
    if [ $? -eq 0 ] || [ $? -eq 1 ]; then
        print_success "Cloudflare API token configured for Worker"
    else
        print_info "Cloudflare API token may already be set"
    fi
else
    print_error "No Cloudflare API token found in .env - AutoRAG sync will not work!"
fi

# Check and set OpenAI API key if available
if [ ! -z "$OPENAI_API_KEY" ]; then
    print_info "Setting OpenAI API key..."
    echo "$OPENAI_API_KEY" | npx --yes wrangler secret put OPENAI_API_KEY --env="" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "OpenAI API key configured"
    else
        print_info "OpenAI API key may already be set"
    fi
else
    print_info "No OpenAI API key found in .env"
fi

# Check and set Anthropic API key if available
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    print_info "Setting Anthropic API key..."
    echo "$ANTHROPIC_API_KEY" | npx --yes wrangler secret put ANTHROPIC_API_KEY --env="" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Anthropic API key configured"
    else
        print_info "Anthropic API key may already be set"
    fi
else
    print_info "No Anthropic API key found in .env"
fi

# Step 3: Generate configuration files
print_step "Generating configuration files..."
cd "$PROJECT_ROOT"

DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Generate deployment-config.json
# Get max upload size from .env, default to 10MB
MAX_UPLOAD_SIZE="${MAX_UPLOAD_SIZE_MB:-10}"

if [ -f "deployment-config.json.template" ]; then
    sed -e "s|{{WORKER_URL}}|$WORKER_URL|g" \
        -e "s|{{WIDGET_URL}}|pending|g" \
        -e "s|{{DEPLOYED_AT}}|$DEPLOYED_AT|g" \
        -e "s|{{ACCOUNT_ID}}|$CLOUDFLARE_ACCOUNT_ID|g" \
        -e "s|{{WORKER_NAME}}|$WORKER_NAME|g" \
        -e "s|{{PAGES_PROJECT_NAME}}|$PAGES_PROJECT|g" \
        -e "s|{{MAX_UPLOAD_SIZE_MB}}|$MAX_UPLOAD_SIZE|g" \
        deployment-config.json.template > deployment-config.json
else
    cat > deployment-config.json << EOF
{
  "worker_url": "$WORKER_URL",
  "widget_url": "pending",
  "deployed_at": "$DEPLOYED_AT",
  "max_upload_size_mb": $MAX_UPLOAD_SIZE,
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

# Check if Pages project exists, create if not
print_info "Checking for Pages project: $PAGES_PROJECT"
PAGES_CHECK=$(npx --yes wrangler pages project list 2>&1)
if echo "$PAGES_CHECK" | grep -qE "(^|\s)$PAGES_PROJECT(\s|$)"; then
    print_info "Using existing Pages project: $PAGES_PROJECT"
else
    print_info "Creating new Pages project: $PAGES_PROJECT"
    CREATE_OUTPUT=$(npx --yes wrangler pages project create "$PAGES_PROJECT" --production-branch=main 2>&1)
    CREATE_EXIT_CODE=$?
    
    if [ $CREATE_EXIT_CODE -eq 0 ]; then
        print_success "Pages project created"
    elif echo "$CREATE_OUTPUT" | grep -q "already exists"; then
        print_info "Pages project already exists, continuing..."
    else
        print_error "Failed to create Pages project:"
        echo "$CREATE_OUTPUT"
        exit 1
    fi
fi

# Deploy to Pages
print_info "Deploying to Cloudflare Pages (this may take a moment)..."
PAGES_OUTPUT=$(npx --yes wrangler pages deploy dist --project-name="$PAGES_PROJECT" --commit-dirty=true 2>&1)

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
        -e "s|{{PAGES_PROJECT_NAME}}|$PAGES_PROJECT|g" \
        -e "s|{{MAX_UPLOAD_SIZE_MB}}|$MAX_UPLOAD_SIZE|g" \
        deployment-config.json.template > deployment-config.json
else
    cat > deployment-config.json << EOF
{
  "worker_url": "$WORKER_URL",
  "widget_url": "$WIDGET_URL",
  "deployed_at": "$DEPLOYED_AT",
  "max_upload_size_mb": $MAX_UPLOAD_SIZE,
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
npx --yes wrangler pages deploy dist --project-name="$PAGES_PROJECT" --commit-dirty=true >/dev/null 2>&1

print_success "Configuration updated"

# Step 7: Upload sample documents (optional)
if [ -d "$PROJECT_ROOT/sample-documents" ] && [ "$SKIP_DOCUMENTS" != "true" ]; then
    print_step "Uploading sample documents..."
    if [ -f "$SCRIPT_DIR/upload-documents.sh" ]; then
        "$SCRIPT_DIR/upload-documents.sh"
    else
        print_info "Document upload script not found, skipping..."
    fi
fi

# Step 8: Summary
echo ""
echo ""
echo "=============================================================="
echo "   ✨ DEPLOYMENT COMPLETE - YOUR URLS"
echo "=============================================================="
echo ""
echo "🔗 Main URLs:"
echo -e "  • Worker API:     ${GREEN}$WORKER_URL${NC}"
echo -e "  • Widget Home:    ${GREEN}$WIDGET_URL${NC}"
echo ""
echo "🎯 Test Your Deployment:"
echo -e "  • Chat Interface: ${BLUE}$WIDGET_URL${NC}"
echo -e "  • Demo Page:      ${BLUE}$WIDGET_URL/demo.html${NC}"
echo -e "  • Playground:     ${BLUE}$WIDGET_URL/playground.html${NC}"
echo -e "  • R2 Browser:     ${BLUE}$WIDGET_URL/r2browser.html${NC}"
echo ""
echo "📋 Integration Code (add to your website):"
echo ""
echo -e "  ${YELLOW}<script src=\"$WIDGET_URL/autorag-widget.min.js\"></script>${NC}"
echo -e "  ${YELLOW}<autorag-widget></autorag-widget>${NC}"
echo ""
echo "📚 Configuration Files:"
echo "  • deployment-config.json"
echo "  • widget/src/config.js"
echo ""
echo "=============================================================="
echo "🚀 Your AutoRAG system is ready to use!"
echo "=============================================================="
echo ""
echo "Need help? Check the documentation in ./docs/"