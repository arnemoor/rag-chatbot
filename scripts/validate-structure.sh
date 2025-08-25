#!/usr/bin/env bash
# Validates that R2 bucket follows correct 3-level structure
# Expected structure: {category}/{product}/{language}/*.md

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${YELLOW}→${NC} $1"; }

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
BUCKET_NAME="${R2_BUCKET_NAME:-library-docs-01}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env file"
    exit 1
fi

echo "================================================"
echo "   R2 Bucket Structure Validation"
echo "   Expected: {category}/{product}/{language}/*.md"
echo "================================================"
echo ""

# Determine how to run wrangler
if command -v wrangler &> /dev/null; then
    WRANGLER_CMD="wrangler"
elif [ -f "widget/node_modules/.bin/wrangler" ]; then
    WRANGLER_CMD="cd widget && npx wrangler"
elif [ -f "worker/node_modules/.bin/wrangler" ]; then
    WRANGLER_CMD="cd worker && npx wrangler"
else
    print_error "Wrangler not found! Please install wrangler"
    exit 1
fi

# Variables for tracking issues
errors=0
warnings=0
valid_files=0
invalid_structure=()
missing_products=()
invalid_languages=()

# Valid language codes
valid_langs="en de fr it es pt zh ja ko ru ar hi"

# Function to validate path structure
validate_path() {
    local path=$1
    
    # Check for directory traversal attempts
    if [[ "$path" == *".."* ]]; then
        print_error "Security issue: Path contains directory traversal: $path"
        ((errors++))
        return 1
    fi
    
    # Skip special folders starting with underscore
    if [[ "$path" == _* ]]; then
        return 0
    fi
    
    # Count path segments
    IFS='/' read -ra segments <<< "$path"
    segment_count=${#segments[@]}
    
    # Validate structure depth (should be 4: category/product/language/file.md)
    if [ $segment_count -lt 4 ]; then
        invalid_structure+=("$path")
        print_error "Invalid structure (too shallow): $path"
        ((errors++))
        return 1
    elif [ $segment_count -gt 4 ]; then
        print_warning "Deeply nested structure: $path"
        ((warnings++))
    fi
    
    # Extract components
    category="${segments[0]}"
    product="${segments[1]}"
    language="${segments[2]}"
    filename="${segments[3]}"
    
    # Validate category (should not be empty)
    if [ -z "$category" ]; then
        print_error "Missing category in: $path"
        ((errors++))
        return 1
    fi
    
    # Validate product (should not be empty)
    if [ -z "$product" ]; then
        missing_products+=("$path")
        print_error "Missing product level in: $path"
        ((errors++))
        return 1
    fi
    
    # Validate language code (should be 2 letters)
    if [ ${#language} -ne 2 ]; then
        invalid_languages+=("$path")
        print_error "Invalid language code '$language' in: $path"
        ((errors++))
        return 1
    fi
    
    # Check if language is in our supported list
    if [[ ! " $valid_langs " =~ " $language " ]]; then
        print_warning "Unusual language code '$language' in: $path"
        ((warnings++))
    fi
    
    # Validate filename (should end with .md)
    if [[ ! "$filename" =~ \.md$ ]]; then
        print_warning "Non-markdown file: $path"
        ((warnings++))
    fi
    
    ((valid_files++))
    return 0
}

print_info "Fetching R2 bucket contents..."

# Get list of all objects in the bucket
if [ "$WRANGLER_CMD" = "wrangler" ]; then
    objects=$(wrangler r2 object list "$BUCKET_NAME" --remote 2>/dev/null | tail -n +2)
else
    objects=$(eval "$WRANGLER_CMD r2 object list '$BUCKET_NAME' --remote 2>/dev/null" | tail -n +2)
fi

if [ -z "$objects" ]; then
    print_warning "No objects found in bucket $BUCKET_NAME"
    exit 0
fi

# Process each object
total_objects=0
while IFS= read -r line; do
    # Skip empty lines
    [ -z "$line" ] && continue
    
    # Extract the object key (first column)
    object_key=$(echo "$line" | awk '{print $1}')
    
    # Skip if extraction failed
    [ -z "$object_key" ] && continue
    
    ((total_objects++))
    
    # Validate the path structure
    validate_path "$object_key"
done <<< "$objects"

echo ""
echo "================================================"
echo "   Validation Results"
echo "================================================"
echo ""

print_info "Total objects scanned: $total_objects"
print_success "Valid 3-level structure: $valid_files files"

if [ $errors -gt 0 ]; then
    print_error "Structure errors found: $errors"
    
    if [ ${#invalid_structure[@]} -gt 0 ]; then
        echo ""
        echo "Files with invalid structure depth:"
        for path in "${invalid_structure[@]}"; do
            echo "  - $path"
        done
    fi
    
    if [ ${#missing_products[@]} -gt 0 ]; then
        echo ""
        echo "Files missing product level:"
        for path in "${missing_products[@]}"; do
            echo "  - $path"
        done
    fi
    
    if [ ${#invalid_languages[@]} -gt 0 ]; then
        echo ""
        echo "Files with invalid language codes:"
        for path in "${invalid_languages[@]}"; do
            echo "  - $path"
        done
    fi
fi

if [ $warnings -gt 0 ]; then
    print_warning "Warnings: $warnings"
fi

echo ""
echo "================================================"
echo "   Summary"
echo "================================================"
echo ""

if [ $errors -eq 0 ]; then
    print_success "All documents follow the correct 3-level structure!"
    print_info "Structure: {category}/{product}/{language}/*.md"
    exit 0
else
    print_error "Found $errors structure errors that need to be fixed"
    print_info "Expected structure: {category}/{product}/{language}/*.md"
    print_info "Run the migration script to fix these issues"
    exit 1
fi