#!/bin/bash

# Upload Library Documents to R2
# This script uploads the sample documents for all library categories

set -e

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
elif [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Configuration from environment
BUCKET_NAME="${R2_BUCKET_NAME:-library-docs-01}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
AUTORAG_ID="${AUTORAG_INSTANCE_ID}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}→${NC} $1"; }

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env file"
    echo "Copy examples/.env.basic to .env and fill in your values"
    echo "See API_TOKEN_SETUP.md for token configuration"
    exit 1
fi

if [ -z "$AUTORAG_INSTANCE_ID" ]; then
    print_error "Please set AUTORAG_INSTANCE_ID in .env file"
    echo "Create an AutoRAG instance at: https://dash.cloudflare.com → AI → AutoRAG"
    exit 1
fi

# Determine how to run wrangler
if command -v wrangler &> /dev/null; then
    # Wrangler is globally installed
    WRANGLER_CMD="wrangler"
    print_info "Using global wrangler installation"
elif [ -f "$PROJECT_ROOT/widget/node_modules/.bin/wrangler" ]; then
    # Wrangler is installed in widget node_modules
    WRANGLER_CMD="cd '$PROJECT_ROOT/widget' && npx wrangler"
    print_info "Using wrangler from widget/node_modules"
else
    print_error "Wrangler not found! Please run:"
    echo "  cd widget && npm install"
    echo "  OR"
    echo "  npm install -g wrangler"
    exit 1
fi

# Function to upload a file
upload_file() {
    local source_file=$1
    local target_path=$2
    
    print_info "Uploading $target_path..."
    
    # Use the determined wrangler command
    if [ "$WRANGLER_CMD" = "wrangler" ]; then
        wrangler r2 object put "$BUCKET_NAME/$target_path" \
            --file="$source_file" \
            --remote
    else
        # Run from widget directory with npx
        cd "$PROJECT_ROOT/widget"
        npx wrangler r2 object put "$BUCKET_NAME/$target_path" \
            --file="$source_file" \
            --remote
        cd "$PROJECT_ROOT"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Uploaded $target_path"
    else
        print_error "Failed to upload $target_path"
        return 1
    fi
}

# Function to upload all files in a directory
upload_directory() {
    local source_dir=$1
    local target_prefix=$2
    
    if [ ! -d "$source_dir" ]; then
        print_error "Directory $source_dir does not exist"
        return 1
    fi
    
    for file in "$source_dir"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            upload_file "$file" "$target_prefix/$filename"
        fi
    done
}

echo "================================================"
echo "   Library Document Upload Script for AutoRAG"
echo "================================================"
echo ""

# Dynamic upload - scan sample-documents directory structure
print_info "Scanning sample-documents directory for categories..."

SAMPLE_DIR="$PROJECT_ROOT/sample-documents"
if [ ! -d "$SAMPLE_DIR" ]; then
    print_error "sample-documents directory not found at $SAMPLE_DIR!"
    exit 1
fi

# Get all category directories (3-level hierarchy: category/product/language)
for category_dir in "$SAMPLE_DIR"/*/; do
    if [ -d "$category_dir" ]; then
        category=$(basename "$category_dir")
        print_info "Found category: $category"
        
        # Iterate through product directories
        for product_dir in "$category_dir"*/; do
            if [ -d "$product_dir" ]; then
                product=$(basename "$product_dir")
                print_info "  Found product: $product"
                
                # Upload all languages for this product
                for lang_dir in "$product_dir"*/; do
                    if [ -d "$lang_dir" ]; then
                        language=$(basename "$lang_dir")
                        print_info "    Uploading $category/$product/$language documents..."
                        upload_directory "$lang_dir" "$category/$product/$language"
                    fi
                done
            fi
        done
    fi
done

echo ""
echo "================================================"
echo "   Triggering AutoRAG Indexing"
echo "================================================"
echo ""

# Trigger indexing
print_info "Triggering AutoRAG sync..."
response=$(curl -s -X PATCH \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/autorag/rags/${AUTORAG_ID}/sync" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json")

if echo "$response" | grep -q '"success":true'; then
    print_success "Indexing triggered successfully"
    job_id=$(echo "$response" | grep -o '"job_id":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$job_id" ]; then
        print_info "Job ID: $job_id"
        print_info "Check progress in Cloudflare Dashboard → AutoRAG → Jobs"
    fi
else
    print_error "Failed to trigger indexing"
    echo "$response"
fi

echo ""
echo "================================================"
echo "   Upload Complete"
echo "================================================"
echo ""
print_success "All library documents have been uploaded"
print_info "Documents are now organized in 3-level hierarchy:"
print_info "  {category}/{product}/{language}/document.md"
print_info "Categories and products will be automatically detected in the interface"
echo ""
# Use the Pages project name from environment or default
PAGES_PROJECT="${PAGES_PROJECT_NAME:-autorag-widget}"
print_info "Test the chatbot at: https://${PAGES_PROJECT}.pages.dev/demo.html"