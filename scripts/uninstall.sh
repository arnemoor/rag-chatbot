#!/bin/bash

# Uninstall script for testing fresh installations
# This removes all installed dependencies and generated files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() { echo -e "${YELLOW}→${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }

echo "================================================"
echo "   AutoRAG - Cleaning Installation"
echo "================================================"
echo ""
echo "This will remove:"
echo "  - All node_modules directories"
echo "  - Generated wrangler.toml files"
echo "  - Generated config files"
echo "  - Package lock files"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Remove node_modules
print_info "Removing node_modules directories..."
rm -rf node_modules 2>/dev/null || true
rm -rf worker/node_modules 2>/dev/null || true
rm -rf widget/node_modules 2>/dev/null || true
print_success "node_modules removed"

# Remove generated config files
print_info "Removing generated config files..."
rm -f worker/wrangler.toml 2>/dev/null || true
rm -f widget/wrangler.toml 2>/dev/null || true
rm -f widget/src/config.js 2>/dev/null || true
rm -f deployment-config.json 2>/dev/null || true
print_success "Generated configs removed"

# Remove package-lock files (optional - for truly fresh install)
print_info "Removing package-lock.json files..."
rm -f package-lock.json 2>/dev/null || true
rm -f worker/package-lock.json 2>/dev/null || true
rm -f widget/package-lock.json 2>/dev/null || true
print_success "Package lock files removed"

# Remove build directories
print_info "Removing build directories..."
rm -rf widget/dist 2>/dev/null || true
rm -rf worker/dist 2>/dev/null || true
print_success "Build directories removed"

# Check for global wrangler
if command -v wrangler &> /dev/null; then
    echo ""
    echo "Global wrangler installation detected."
    echo "To uninstall it globally, run: npm uninstall -g wrangler"
    echo "(May require sudo/admin privileges)"
fi

echo ""
echo "================================================"
echo "   Clean Complete!"
echo "================================================"
echo ""
print_success "All local dependencies and generated files removed"
echo ""
echo "To test a fresh installation:"
echo "  1. ./scripts/install-dependencies.sh"
echo "  2. cp examples/.env.basic .env"
echo "  3. Edit .env with your credentials"
echo "  4. ./scripts/deploy.sh"
echo ""