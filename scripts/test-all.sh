#!/bin/bash

# Test runner script for AutoRAG Clean framework
# Runs tests for both Worker and Widget components

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 AutoRAG Clean - Running All Tests"
echo "===================================="
echo ""

# Function to run tests for a component
run_tests() {
    local component=$1
    local dir=$2
    
    echo "📦 Testing $component..."
    echo "------------------------"
    
    cd "$dir"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies for $component...${NC}"
        npm install
    fi
    
    # Run tests
    if npm test; then
        echo -e "${GREEN}✅ $component tests passed!${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ $component tests failed!${NC}"
        echo ""
        return 1
    fi
}

# Track overall success
overall_success=true

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Run Worker tests
if ! run_tests "Worker (Backend)" "$PROJECT_ROOT/worker"; then
    overall_success=false
fi

# Run Widget tests  
if ! run_tests "Widget (Frontend)" "$PROJECT_ROOT/widget"; then
    overall_success=false
fi

# Summary
echo "===================================="
if $overall_success; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi