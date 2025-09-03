#!/bin/bash

# Setup script for AutoRAG project
# This script sets up the complete environment for development or production

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_info() { echo -e "${YELLOW}→${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_header() { echo -e "${BLUE}═══${NC} $1 ${BLUE}═══${NC}"; }

echo "================================================"
echo "   AutoRAG - Complete Setup"
echo "================================================"
echo ""

# Parse command line arguments
SKIP_INSTALL=false
SKIP_DEPLOY=false
UPLOAD_DOCS=false
ENV_FILE=".env"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        --upload-docs)
            UPLOAD_DOCS=true
            shift
            ;;
        --env)
            ENV_FILE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-install    Skip dependency installation"
            echo "  --skip-deploy     Skip deployment to Cloudflare"
            echo "  --upload-docs     Upload sample documents after setup"
            echo "  --env FILE        Use specific env file (default: .env)"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Full setup with install and deploy"
            echo "  $0 --upload-docs       # Full setup plus document upload"
            echo "  $0 --skip-install      # Deploy only (dependencies already installed)"
            echo "  $0 --env .env.prod     # Use production environment"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ required (found: $(node -v 2>/dev/null || echo 'not installed'))"
    echo "Please install Node.js 18 or later from https://nodejs.org"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check for Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    echo "Please install Git from https://git-scm.com"
    exit 1
fi
print_success "Git detected"

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "worker" ] || [ ! -d "widget" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi
print_success "Project structure verified"

# Step 1: Environment Configuration
print_header "Environment Configuration"

if [ ! -f "$ENV_FILE" ]; then
    print_info "No $ENV_FILE file found. Creating from example..."
    
    # Try to find an example file
    if [ -f "examples/.env.basic" ]; then
        cp examples/.env.basic "$ENV_FILE"
        print_success "Created $ENV_FILE from examples/.env.basic"
    elif [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        print_success "Created $ENV_FILE from .env.example"
    else
        print_error "No example environment file found"
        echo "Please create a $ENV_FILE file with your configuration"
        echo "Required variables:"
        echo "  CLOUDFLARE_ACCOUNT_ID"
        echo "  CLOUDFLARE_API_TOKEN"
        echo "  R2_BUCKET_NAME"
        echo "  AUTORAG_INSTANCE"
        exit 1
    fi
    
    echo ""
    print_info "Please edit $ENV_FILE with your Cloudflare credentials"
    print_info "Opening in default editor..."
    ${EDITOR:-nano} "$ENV_FILE"
else
    print_success "Environment file $ENV_FILE exists"
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Validate required environment variables
MISSING_VARS=()
[ -z "$CLOUDFLARE_ACCOUNT_ID" ] && MISSING_VARS+=("CLOUDFLARE_ACCOUNT_ID")
[ -z "$R2_BUCKET_NAME" ] && MISSING_VARS+=("R2_BUCKET_NAME")
[ -z "$AUTORAG_INSTANCE" ] && MISSING_VARS+=("AUTORAG_INSTANCE")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please edit $ENV_FILE and add the missing variables"
    exit 1
fi
print_success "Environment variables validated"

# Step 2: Install Dependencies
if [ "$SKIP_INSTALL" = false ]; then
    print_header "Installing Dependencies"
    
    if [ -f "scripts/install-dependencies.sh" ]; then
        ./scripts/install-dependencies.sh
    else
        print_info "install-dependencies.sh not found, running npm install directly..."
        
        # Install root dependencies if package.json exists
        if [ -f "package.json" ]; then
            print_info "Installing root dependencies..."
            npm install
            print_success "Root dependencies installed"
        fi
        
        # Install worker dependencies
        print_info "Installing worker dependencies..."
        cd worker && npm install && cd ..
        print_success "Worker dependencies installed"
        
        # Install widget dependencies
        print_info "Installing widget dependencies..."
        cd widget && npm install && cd ..
        print_success "Widget dependencies installed"
    fi
else
    print_info "Skipping dependency installation (--skip-install flag)"
fi

# Step 3: Build the Project
print_header "Building Project"

print_info "Building worker..."
cd worker && npm run build && cd ..
print_success "Worker built successfully"

print_info "Building widget..."
cd widget && npm run build && cd ..
print_success "Widget built successfully"

# Step 4: Deploy to Cloudflare
if [ "$SKIP_DEPLOY" = false ]; then
    print_header "Deploying to Cloudflare"
    
    if [ -f "scripts/deploy.sh" ]; then
        ./scripts/deploy.sh
    else
        print_error "deploy.sh script not found"
        echo "Please run deployment manually:"
        echo "  cd worker && npx wrangler deploy"
        echo "  cd widget && npx wrangler pages deploy dist --project-name=autorag-widget"
    fi
else
    print_info "Skipping deployment (--skip-deploy flag)"
fi

# Step 5: Upload Sample Documents (optional)
if [ "$UPLOAD_DOCS" = true ]; then
    print_header "Uploading Sample Documents"
    
    if [ -f "scripts/upload-library-documents.sh" ]; then
        ./scripts/upload-library-documents.sh
    else
        print_info "Upload script not found, uploading manually..."
        
        if [ -d "sample-documents" ]; then
            print_info "Uploading documents from sample-documents/"
            
            # Upload each file in sample-documents to R2
            for file in sample-documents/**/*.{md,pdf,txt,html,csv,json,docx,xlsx} 2>/dev/null; do
                if [ -f "$file" ]; then
                    # Extract relative path for R2 key
                    rel_path=${file#sample-documents/}
                    print_info "Uploading $rel_path..."
                    npx wrangler r2 object put "${R2_BUCKET_NAME}/${rel_path}" --file="$file" --local
                fi
            done
            
            print_success "Sample documents uploaded"
            
            # Trigger AutoRAG indexing
            print_info "Triggering AutoRAG indexing..."
            if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
                curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${AUTORAG_INSTANCE}/sync" \
                    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
                    -H "Content-Type: application/json" \
                    --silent --show-error
                print_success "Indexing triggered"
            else
                print_info "CLOUDFLARE_API_TOKEN not set, skipping indexing trigger"
                echo "Please trigger indexing manually in Cloudflare Dashboard"
            fi
        else
            print_info "No sample-documents directory found"
        fi
    fi
else
    print_info "Skipping document upload (use --upload-docs to enable)"
fi

# Step 6: Verify Deployment
print_header "Verification"

# Get deployment URLs
WORKER_URL=""
WIDGET_URL=""

if [ -f ".deployment-config" ]; then
    source .deployment-config
fi

if [ ! -z "$WORKER_URL" ]; then
    print_info "Testing Worker API at $WORKER_URL..."
    if curl -s "$WORKER_URL/health" | grep -q "healthy"; then
        print_success "Worker API is healthy"
    else
        print_error "Worker API health check failed"
    fi
fi

if [ ! -z "$WIDGET_URL" ]; then
    print_info "Widget deployed at: $WIDGET_URL"
    print_success "Widget URL: $WIDGET_URL"
fi

# Final Summary
echo ""
echo "================================================"
echo "   Setup Complete!"
echo "================================================"
echo ""

if [ ! -z "$WORKER_URL" ]; then
    print_success "API Endpoint: $WORKER_URL"
fi

if [ ! -z "$WIDGET_URL" ]; then
    print_success "Widget Demo: $WIDGET_URL/demo.html"
    print_success "Playground: $WIDGET_URL/playground"
fi

echo ""
print_info "Next Steps:"
echo "  1. Test the widget at the demo URL"
echo "  2. Integrate the widget into your application"
echo "  3. Upload your own documents to R2"
echo "  4. Configure AI models and providers as needed"
echo ""
print_info "For more information, see docs/developers/quickstart.md"
echo ""