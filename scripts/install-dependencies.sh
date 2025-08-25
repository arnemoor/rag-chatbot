#!/bin/bash

# Install all dependencies for the AutoRAG project
# Run this once after cloning the repository

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
echo "   AutoRAG - Installing Dependencies"
echo "================================================"
echo ""

# Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ required (found: $(node -v))"
    echo "Please install Node.js 18 or later from https://nodejs.org"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Install root dependencies if package.json exists
if [ -f "package.json" ]; then
    print_info "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
fi

# Install worker dependencies
print_info "Installing worker dependencies..."
cd worker
npm install
print_success "Worker dependencies installed"
cd ..

# Install widget dependencies
print_info "Installing widget dependencies..."
cd widget
npm install
print_success "Widget dependencies installed"
cd ..

# Install wrangler globally (optional but recommended)
print_info "Checking for global wrangler installation..."
if ! command -v wrangler &> /dev/null; then
    echo ""
    echo "Wrangler is not installed globally."
    echo "Would you like to install it globally? (recommended)"
    echo "This requires sudo/admin privileges."
    read -p "Install wrangler globally? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing wrangler globally..."
        npm install -g wrangler
        print_success "Wrangler installed globally"
    else
        print_info "Skipping global wrangler installation"
        echo "Wrangler will be used from node_modules when needed"
    fi
else
    print_success "Wrangler is already installed globally"
fi

echo ""
echo "================================================"
echo "   Installation Complete!"
echo "================================================"
echo ""
print_success "All dependencies installed successfully"
echo ""
echo "📚 Next steps:"
echo "  1. Copy and configure .env: cp examples/.env.basic .env"
echo "  2. Edit .env with your Cloudflare credentials"
echo "  3. Run setup: ./scripts/setup.sh"
echo "  4. Deploy: ./scripts/deploy.sh"
echo ""