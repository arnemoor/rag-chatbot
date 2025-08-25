#!/usr/bin/env bash
# Migrate sample documents from 2-level to 3-level structure
# This script reorganizes the existing sample documents to include product level

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}→${NC} $1"; }

echo "================================================"
echo "   Sample Documents Migration Script"
echo "   From: {category}/{language}/"
echo "   To:   {category}/{product}/{language}/"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "sample-documents" ]; then
    print_error "sample-documents directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Define product mappings for each category
# Using case statement for compatibility instead of associative arrays
get_primary_product() {
    case "$1" in
        fiction) echo "novels" ;;
        non-fiction) echo "self-help" ;;
        technology) echo "programming" ;;
        science) echo "research" ;;
        reference) echo "catalog" ;;
        *) echo "default" ;;
    esac
}

get_secondary_product() {
    case "$1" in
        fiction) echo "short-stories" ;;
        non-fiction) echo "biography" ;;
        technology) echo "ai-ml" ;;
        science) echo "physics" ;;
        reference) echo "encyclopedias" ;;
        *) echo "" ;;
    esac
}

cd sample-documents

print_info "Starting migration of sample documents..."
echo ""

# Process each category
for category_dir in */; do
    if [ -d "$category_dir" ]; then
        category_name=${category_dir%/}
        primary_product=$(get_primary_product "$category_name")
        secondary_product=$(get_secondary_product "$category_name")
        
        print_info "Processing category: $category_name"
        
        # Create primary product directory
        if [ ! -d "$category_name/$primary_product" ]; then
            mkdir -p "$category_name/$primary_product"
            print_success "  Created product directory: $primary_product"
        fi
        
        # Create secondary product directory if defined
        if [ -n "$secondary_product" ] && [ ! -d "$category_name/$secondary_product" ]; then
            mkdir -p "$category_name/$secondary_product"
            print_success "  Created product directory: $secondary_product"
        fi
        
        # Move language directories into primary product
        moved_count=0
        for item in "$category_name"/*; do
            if [ -d "$item" ]; then
                dir_name=$(basename "$item")
                
                # Skip if it's already a product directory
                if [[ "$dir_name" == "$primary_product" ]] || [[ "$dir_name" == "$secondary_product" ]]; then
                    continue
                fi
                
                # Check if it's a language directory (2-letter code)
                if [[ ${#dir_name} -eq 2 ]]; then
                    print_info "    Moving $category_name/$dir_name to $category_name/$primary_product/$dir_name"
                    mv "$item" "$category_name/$primary_product/"
                    ((moved_count++))
                    
                    # For demonstration, copy some languages to secondary product
                    if [ -n "$secondary_product" ] && [[ "$dir_name" == "en" ]]; then
                        # Create a copy for secondary product (with different content ideally)
                        print_info "    Creating sample for $category_name/$secondary_product/$dir_name"
                        mkdir -p "$category_name/$secondary_product/$dir_name"
                        
                        # Copy and rename files to indicate they're for different product
                        for file in "$category_name/$primary_product/$dir_name"/*.md; do
                            if [ -f "$file" ]; then
                                filename=$(basename "$file" .md)
                                cp "$file" "$category_name/$secondary_product/$dir_name/${filename}-${secondary_product}.md"
                            fi
                        done
                    fi
                fi
            fi
        done
        
        if [ $moved_count -gt 0 ]; then
            print_success "  Migrated $moved_count language directories"
        else
            print_info "  No language directories to migrate (might be already migrated)"
        fi
        
        echo ""
    fi
done

cd ..

# Verify the new structure
echo "================================================"
echo "   Verification"
echo "================================================"
echo ""

print_info "New structure:"
tree -L 3 sample-documents 2>/dev/null || find sample-documents -type d -maxdepth 3 | sort

echo ""
echo "================================================"
echo "   Migration Complete!"
echo "================================================"
echo ""

print_success "Sample documents have been migrated to 3-level hierarchy"
print_info "Structure: {category}/{product}/{language}/"
print_info "Next step: Run the upload script to push documents to R2"

# Create a backup marker
touch sample-documents/.migrated-to-3-level

echo ""