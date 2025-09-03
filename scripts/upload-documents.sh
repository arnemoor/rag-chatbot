#!/bin/bash

# Upload Library Documents to R2
# This script uploads the sample documents for all library categories
# Usage: ./upload-documents.sh [--sync]
#   --sync: Remove R2 objects that don't exist locally (full sync)

set -e

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Parse command line arguments
SYNC_MODE=false
for arg in "$@"; do
    case $arg in
        --sync)
            SYNC_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--sync]"
            echo "  --sync: Remove R2 objects that don't exist locally (full sync)"
            echo ""
            echo "Without --sync, this script only uploads/updates files."
            echo "With --sync, it also removes files from R2 that no longer exist locally."
            exit 0
            ;;
    esac
done

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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}→${NC} $1"; }
print_warning() { echo -e "${BLUE}⚠${NC} $1"; }

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
elif command -v npx &> /dev/null; then
    # Use npx to run wrangler (it will find it in local node_modules or install it)
    WRANGLER_CMD="npx"
    print_info "Using npx to run wrangler"
else
    print_error "Neither wrangler nor npx found! Please install Node.js and npm"
    exit 1
fi

# Arrays to track files
declare -a LOCAL_FILES
declare -a R2_FILES
declare -a FILES_TO_DELETE

# Function to get list of R2 objects
get_r2_objects() {
    print_info "Fetching list of objects from R2 bucket..."
    
    if [ "$WRANGLER_CMD" = "wrangler" ]; then
        R2_OUTPUT=$(wrangler r2 object list "$BUCKET_NAME" --remote 2>/dev/null)
    else
        R2_OUTPUT=$(npx wrangler r2 object list "$BUCKET_NAME" --remote 2>/dev/null)
    fi
    
    # Parse the output to get just the file paths
    # The output format is like: "key" or sometimes includes size and date
    while IFS= read -r line; do
        # Skip empty lines and header lines
        if [[ ! -z "$line" ]] && [[ ! "$line" =~ ^"Key" ]] && [[ "$line" =~ \.md$ ]]; then
            # Extract just the key/path
            key=$(echo "$line" | awk '{print $1}')
            R2_FILES+=("$key")
        fi
    done <<< "$R2_OUTPUT"
    
    print_success "Found ${#R2_FILES[@]} files in R2"
}

# Function to upload a file
upload_file() {
    local source_file=$1
    local target_path=$2
    
    print_info "Uploading $target_path..."
    
    # Always use --remote for production deployment
    LOCATION_FLAG="--remote"
    
    if [ "$WRANGLER_CMD" = "wrangler" ]; then
        wrangler r2 object put "$BUCKET_NAME/$target_path" \
            --file="$source_file" \
            $LOCATION_FLAG
    elif [ "$WRANGLER_CMD" = "npx" ]; then
        # Use npx to run wrangler
        npx wrangler r2 object put "$BUCKET_NAME/$target_path" \
            --file="$source_file" \
            $LOCATION_FLAG
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Uploaded $target_path"
        # Track this file as uploaded
        LOCAL_FILES+=("$target_path")
    else
        print_error "Failed to upload $target_path"
        return 1
    fi
}

# Function to delete a file from R2
delete_file() {
    local target_path=$1
    
    print_warning "Deleting $target_path from R2..."
    
    if [ "$WRANGLER_CMD" = "wrangler" ]; then
        wrangler r2 object delete "$BUCKET_NAME/$target_path" --remote
    else
        npx wrangler r2 object delete "$BUCKET_NAME/$target_path" --remote
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Deleted $target_path"
    else
        print_error "Failed to delete $target_path"
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

if [ "$SYNC_MODE" = true ]; then
    print_info "Running in SYNC mode - will delete orphaned files from R2"
    # Get current R2 objects first
    get_r2_objects
else
    print_info "Running in UPDATE mode - will only upload/update files"
fi

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

# If in sync mode, delete orphaned files
if [ "$SYNC_MODE" = true ]; then
    echo ""
    echo "================================================"
    echo "   Checking for Orphaned Files"
    echo "================================================"
    echo ""
    
    # Find files that exist in R2 but not locally
    for r2_file in "${R2_FILES[@]}"; do
        found=false
        for local_file in "${LOCAL_FILES[@]}"; do
            if [ "$r2_file" = "$local_file" ]; then
                found=true
                break
            fi
        done
        
        if [ "$found" = false ]; then
            FILES_TO_DELETE+=("$r2_file")
        fi
    done
    
    if [ ${#FILES_TO_DELETE[@]} -eq 0 ]; then
        print_success "No orphaned files found in R2"
    else
        print_warning "Found ${#FILES_TO_DELETE[@]} orphaned files in R2"
        
        # Confirm deletion
        echo ""
        echo "The following files will be deleted from R2:"
        for file in "${FILES_TO_DELETE[@]}"; do
            echo "  - $file"
        done
        echo ""
        read -p "Proceed with deletion? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for file in "${FILES_TO_DELETE[@]}"; do
                delete_file "$file"
            done
        else
            print_info "Skipping deletion of orphaned files"
        fi
    fi
fi

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
if [ "$SYNC_MODE" = true ]; then
    print_info "Sync mode: Orphaned files have been handled"
fi
print_info "Documents are organized in 3-level hierarchy:"
print_info "  {category}/{product}/{language}/document.md"
print_info "Categories and products will be automatically detected in the interface"
echo ""
# Use the Pages project name from environment or default
PAGES_PROJECT="${PAGES_PROJECT_NAME:-autorag-widget}"
print_info "Test the chatbot at: https://${PAGES_PROJECT}.pages.dev/demo.html"