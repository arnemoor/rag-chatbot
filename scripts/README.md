# AutoRAG Scripts

This directory contains utility scripts for deploying and managing the AutoRAG framework.

## 🚀 Essential Scripts

### **deploy.sh**
Complete deployment of worker and widget to Cloudflare.
```bash
./scripts/deploy.sh
```
- Deploys worker to Cloudflare Workers
- Deploys widget to Cloudflare Pages
- Generates deployment configuration
- Creates deployment-config.json

### **install-dependencies.sh**
Install all project dependencies for root, worker, and widget.
```bash
./scripts/install-dependencies.sh
```
- Checks Node.js version (18+ required)
- Installs npm dependencies for all packages
- Installs wrangler CLI if needed

### **upload-documents.sh**
Upload documents to R2 bucket with proper 3-level structure (category/product/language).
```bash
./scripts/upload-documents.sh
```
- Requires Cloudflare API credentials in .env
- Uploads sample documents from sample-documents/
- Maintains folder structure for AutoRAG indexing

## ⚙️ Configuration Scripts

### **configure-from-env.sh**
Generate wrangler.toml configuration files from templates using .env variables.
```bash
./scripts/configure-from-env.sh
```
- Creates worker/wrangler.toml from template
- Substitutes environment variables
- Cross-platform compatible (macOS/Linux)

### **test-deploy.sh**
Test Cloudflare authentication and deployment configuration.
```bash
./scripts/test-deploy.sh
```
- Verifies Cloudflare credentials
- Checks wrangler configuration
- Useful for troubleshooting deployment issues

## 🧹 Maintenance Scripts

### **uninstall.sh**
Clean installation for testing fresh setups.
```bash
./scripts/uninstall.sh
```
- Removes node_modules directories
- Deletes generated configuration files
- Cleans build artifacts
- Interactive confirmation for safety

### **validate-structure.sh**
Validate R2 bucket follows required 3-level document structure.
```bash
./scripts/validate-structure.sh
```
- Checks for category/product/language structure
- Reports missing or incorrect paths
- Ensures AutoRAG can properly index documents

### **test-all.sh**
Run tests for worker and widget packages.
```bash
./scripts/test-all.sh
```
- Runs worker tests
- Runs widget tests
- Reports test results

## 📋 Prerequisites

Before running scripts, ensure you have:

1. **Node.js 18+** and **npm 8+** installed
2. **Cloudflare account** with required services enabled
3. **.env file** with necessary credentials:
   ```env
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   AUTORAG_INSTANCE_ID=your-autorag-instance
   R2_BUCKET_NAME=your-bucket-name
   ```

## 🔧 Common Workflows

### Initial Setup
```bash
# 1. Install dependencies
./scripts/install-dependencies.sh

# 2. Configure environment
cp examples/.env.basic .env
# Edit .env with your credentials

# 3. Generate configuration
./scripts/configure-from-env.sh

# 4. Deploy to Cloudflare
./scripts/deploy.sh

# 5. Upload sample documents
./scripts/upload-documents.sh
```

### Development
```bash
# Start development servers
npm run dev:widget  # In one terminal
npm run dev:worker  # In another terminal
```

### Testing Deployment
```bash
# Verify configuration
./scripts/test-deploy.sh

# Validate document structure
./scripts/validate-structure.sh
```

## 🛠️ Troubleshooting

If scripts fail:

1. Check prerequisites (Node.js version, npm)
2. Verify .env file has all required variables
3. Run `./scripts/test-deploy.sh` to check Cloudflare access
4. Check script output for specific error messages
5. See [Troubleshooting Guide](../docs/TROUBLESHOOTING.md)

## 📝 Notes

- All scripts use bash and are tested on macOS/Linux
- Windows users should use WSL or Git Bash
- Scripts include error handling and colored output
- Most scripts check prerequisites before running
- Destructive operations require confirmation