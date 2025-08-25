#!/bin/bash

# Script to generate wrangler.toml files from templates using .env values
# This ensures all configuration is centralized in .env

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_info() { echo -e "${YELLOW}→${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

echo "================================================"
echo "   AutoRAG Configuration from .env"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo ""
    echo "Please create .env from the template:"
    echo "  cp examples/.env.basic .env"
    echo "  # Edit .env with your values"
    exit 1
fi

# Load environment variables
print_info "Loading configuration from .env..."
set -a
source .env
set +a

# Verify required variables
REQUIRED_VARS=(
    "CLOUDFLARE_ACCOUNT_ID"
    "CLOUDFLARE_API_TOKEN"
    "AUTORAG_INSTANCE_ID"
    "R2_BUCKET_NAME"
    "WORKER_NAME"
    "PAGES_PROJECT_NAME"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please edit .env and set all required values"
    exit 1
fi

# Set default for optional AI Gateway
AI_GATEWAY_NAME=${AI_GATEWAY_NAME:-"autorag-gateway"}

# Function to replace template variables
replace_template_vars() {
    local template_file=$1
    local output_file=$2
    
    if [ ! -f "$template_file" ]; then
        print_error "Template file not found: $template_file"
        return 1
    fi
    
    # Read template and replace variables
    cp "$template_file" "$output_file"
    
    # Replace all template variables
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/{{WORKER_NAME}}/$WORKER_NAME/g" "$output_file"
        sed -i '' "s/{{CLOUDFLARE_ACCOUNT_ID}}/$CLOUDFLARE_ACCOUNT_ID/g" "$output_file"
        sed -i '' "s/{{AUTORAG_INSTANCE_ID}}/$AUTORAG_INSTANCE_ID/g" "$output_file"
        sed -i '' "s/{{R2_BUCKET_NAME}}/$R2_BUCKET_NAME/g" "$output_file"
        sed -i '' "s/{{PAGES_PROJECT_NAME}}/$PAGES_PROJECT_NAME/g" "$output_file"
        sed -i '' "s/{{AI_GATEWAY_NAME}}/$AI_GATEWAY_NAME/g" "$output_file"
    else
        # Linux
        sed -i "s/{{WORKER_NAME}}/$WORKER_NAME/g" "$output_file"
        sed -i "s/{{CLOUDFLARE_ACCOUNT_ID}}/$CLOUDFLARE_ACCOUNT_ID/g" "$output_file"
        sed -i "s/{{AUTORAG_INSTANCE_ID}}/$AUTORAG_INSTANCE_ID/g" "$output_file"
        sed -i "s/{{R2_BUCKET_NAME}}/$R2_BUCKET_NAME/g" "$output_file"
        sed -i "s/{{PAGES_PROJECT_NAME}}/$PAGES_PROJECT_NAME/g" "$output_file"
        sed -i "s/{{AI_GATEWAY_NAME}}/$AI_GATEWAY_NAME/g" "$output_file"
    fi
}

# Generate worker/wrangler.toml from template
print_info "Generating worker/wrangler.toml from template..."
if replace_template_vars "worker/wrangler.toml.template" "worker/wrangler.toml"; then
    print_success "Created worker/wrangler.toml"
else
    print_error "Failed to create worker/wrangler.toml"
    exit 1
fi

# Generate widget/wrangler.toml from template
print_info "Generating widget/wrangler.toml from template..."
if replace_template_vars "widget/wrangler.toml.template" "widget/wrangler.toml"; then
    print_success "Created widget/wrangler.toml"
else
    print_error "Failed to create widget/wrangler.toml"
    exit 1
fi

# Create a configuration summary file
print_info "Creating configuration summary..."
cat > configuration-summary.txt << EOF
AutoRAG Configuration Summary
Generated: $(date)
====================================

Cloudflare Account:
  Account ID: $CLOUDFLARE_ACCOUNT_ID
  
AutoRAG Setup:
  Instance ID: $AUTORAG_INSTANCE_ID
  R2 Bucket: $R2_BUCKET_NAME
  
Project Names:
  Worker: $WORKER_NAME
  Pages: $PAGES_PROJECT_NAME
  
Expected URLs (after deployment):
  Worker: https://$WORKER_NAME.*.workers.dev
  Pages: https://$PAGES_PROJECT_NAME.pages.dev
  
Optional Configuration:
  AI Gateway: $AI_GATEWAY_NAME
  OpenAI: ${OPENAI_API_KEY:+Configured}
  Anthropic: ${ANTHROPIC_API_KEY:+Configured}
EOF

print_success "Configuration complete!"
echo ""
echo "📋 Generated files:"
echo "  • worker/wrangler.toml"
echo "  • widget/wrangler.toml"
echo "  • configuration-summary.txt"
echo ""
echo "📚 Next steps:"
echo "  1. Deploy the worker and widget: ./scripts/deploy.sh"
echo "  2. Upload documents: ./scripts/upload-library-documents.sh"
echo "  3. Test the deployment: open the widget URL shown after deployment"
echo ""

# Show configuration summary
echo "Current Configuration:"
echo "----------------------"
cat configuration-summary.txt