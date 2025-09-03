#!/bin/bash

# Test coverage script for AutoRAG project
# Runs test coverage for both worker and widget components

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
echo "   AutoRAG - Test Coverage Report"
echo "================================================"
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "worker" ] || [ ! -d "widget" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Function to run coverage for a component
run_coverage() {
    local component=$1
    local dir=$2
    
    print_info "Running test coverage for $component..."
    
    if [ ! -d "$dir" ]; then
        print_error "$component directory not found: $dir"
        return 1
    fi
    
    cd "$dir"
    
    # Check if test script exists
    if [ ! -f "package.json" ]; then
        print_error "No package.json found in $dir"
        cd ..
        return 1
    fi
    
    # Check if test:coverage script exists
    if grep -q '"test:coverage"' package.json; then
        npm run test:coverage
        print_success "$component coverage complete"
    else
        # Fallback to regular test with coverage if available
        if grep -q '"test"' package.json; then
            print_info "No test:coverage script found, running regular tests..."
            npm test -- --coverage 2>/dev/null || npm test
            print_success "$component tests complete"
        else
            print_error "No test scripts found for $component"
        fi
    fi
    
    cd ..
    echo ""
}

# Run coverage for worker
run_coverage "Worker" "worker"

# Run coverage for widget
run_coverage "Widget" "widget"

# Generate combined coverage report if nyc is available
if command -v nyc &> /dev/null; then
    print_info "Generating combined coverage report..."
    
    # Create coverage directory if it doesn't exist
    mkdir -p coverage
    
    # Merge coverage reports if they exist
    if [ -f "worker/coverage/coverage-final.json" ] && [ -f "widget/coverage/coverage-final.json" ]; then
        nyc merge worker/coverage coverage/worker.json
        nyc merge widget/coverage coverage/widget.json
        nyc report --reporter=html --reporter=text
        print_success "Combined coverage report generated in coverage/"
    else
        print_info "Individual coverage reports not found, skipping merge"
    fi
fi

echo ""
echo "================================================"
echo "   Coverage Report Complete"
echo "================================================"
echo ""

# Display summary if coverage files exist
if [ -f "worker/coverage/lcov-report/index.html" ]; then
    print_success "Worker coverage report: worker/coverage/lcov-report/index.html"
fi

if [ -f "widget/coverage/lcov-report/index.html" ]; then
    print_success "Widget coverage report: widget/coverage/lcov-report/index.html"
fi

if [ -f "coverage/index.html" ]; then
    print_success "Combined coverage report: coverage/index.html"
fi

echo ""
print_info "To view coverage reports, open the HTML files in your browser"
echo ""