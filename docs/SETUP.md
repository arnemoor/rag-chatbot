# Setup Guide - RAG Chatbot

This guide walks you through setting up and deploying the AutoRAG library document Q&A system.

## Prerequisites

1. **Cloudflare Account** with:
   - AutoRAG enabled (create instance at dashboard)
   - R2 storage enabled
   - Workers and Pages enabled
   - AI Gateway configured (optional, for external models)

2. **Development Environment**:
   - Node.js 20+ recommended (18+ minimum)
   - npm 8+
   - Git
   - Wrangler CLI (installed automatically)

   **Ubuntu Users**: Ubuntu 24.04 defaults to Node 18. For best compatibility:
   ```bash
   # Add NodeSource repository for Node 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **API Credentials**:
   - Cloudflare Account ID
   - Cloudflare API Token with permissions:
     - AutoRAG:Edit
     - R2:Edit
     - Workers:Edit
     - Pages:Edit

## Step 1: Clone Repository

```bash
git clone https://github.com/arnemoor/rag-chatbot.git
cd rag-chatbot
```

## Step 2: Install Dependencies

```bash
./scripts/install-dependencies.sh
```

This installs:
- Worker dependencies
- Widget dependencies
- Wrangler CLI (if not globally installed)

**Note for Linux/Ubuntu users**: If prompted to install wrangler globally:
- Option 1: Answer 'y' and then run `sudo npm install -g wrangler` manually
- Option 2: Run the script with sudo: `sudo ./scripts/install-dependencies.sh`
- Option 3: Skip global install and use local wrangler with `npx wrangler`

## Step 3: Configure Environment

### Manual Setup in Cloudflare Dashboard (Do this FIRST):

#### 1. Create API Token:
- Go to: My Profile → API Tokens → Create Token
- Use "Custom token" with these permissions:
  - Account: AutoRAG:Edit
  - Account: Cloudflare Workers R2 Storage:Edit  
  - Account: Workers Scripts:Edit
  - Account: Cloudflare Pages:Edit
- Copy the token immediately!

#### 2. Create R2 Bucket:
- Go to: R2 → Create bucket
- Name: `rag-chatbot-docs` (or your preferred name)
- Location: Automatic
- Leave all other settings as default

#### 3. Create AutoRAG Instance:
- Go to: AI → AutoRAG → Create new instance
- Name: `my-rag-chatbot` (or your preferred name)
- Select the R2 bucket you just created
- Configure indexing (use defaults for testing)
- Create the instance

### Configure .env file:

```bash
cp examples/.env.basic .env
```

Edit .env with the values from above:

```env
# Project Names (must be unique per deployment in your account)
WORKER_NAME=autorag-worker
PAGES_PROJECT_NAME=autorag-widget

# From Cloudflare Dashboard (right sidebar)
CLOUDFLARE_ACCOUNT_ID=your-account-id

# From step 1: Your API Token
CLOUDFLARE_API_TOKEN=your-api-token

# From step 2: Your R2 bucket name
R2_BUCKET_NAME=rag-chatbot-docs

# From step 3: Your AutoRAG instance name
AUTORAG_INSTANCE_ID=my-rag-chatbot

# Optional - External AI Providers
OPENAI_API_KEY=     # Leave empty if not using OpenAI
ANTHROPIC_API_KEY=  # Leave empty if not using Anthropic
```

## Step 4: Deploy Infrastructure

### Option A: Automated Deployment (Recommended)

```bash
./scripts/deploy.sh
```

This script will:
1. Check your configuration
2. Deploy Worker API to Cloudflare
3. Deploy Widget to Cloudflare Pages
4. Generate deployment configuration
5. Provide you with the URLs

To also upload sample documents:
```bash
./scripts/upload-documents.sh
```

### Option B: Step-by-Step Deployment

```bash
# 1. Deploy Worker API
cd worker
npx wrangler deploy

# 2. Deploy Widget
cd ../widget
npm run build
npx wrangler pages deploy dist --project-name $PAGES_PROJECT_NAME

# 3. Upload documents
cd ..
./scripts/upload-documents.sh

# 4. Update configuration
./scripts/update-deployment-config.sh
```

## Step 5: Verify Deployment

After deployment, you'll see URLs like:

```
Worker API: https://your-worker.workers.dev
Widget URL: https://your-widget.pages.dev
```

Test the deployment:

1. **Check API Health**:
   ```bash
   curl https://your-worker-url/health
   ```

2. **View Demo Page**:
   Open https://your-widget-url/demo.html

3. **Browse R2 Documents**:
   Open https://your-widget-url/r2browser

## Step 6: Integration

### Embed Widget in Your Site

Add to any HTML page:

```html
<script src="https://your-widget-url/autorag-widget.min.js"></script>
<autorag-widget 
  language="en"
  category="fiction"
  product="literature"
  theme="light"
  position="bottom-right">
</autorag-widget>
```

### Widget Parameters

- `language`: "en", "de", "fr", "it"
- `category`: "fiction", "non-fiction", "reference", "science", "technology"
- `product`: Subcategory within category
- `theme`: "light" or "dark"
- `position`: "bottom-right", "bottom-left", "top-right", "top-left"
- `button-text`: Custom button text
- `header-title`: Custom header title

### Use Standalone Chat

Open https://your-widget-url/ for the full chat interface.

## Configuration Files

After deployment, these files are created:

### deployment-config.json
```json
{
  "worker_url": "https://...",
  "widget_url": "https://...",
  "deployed_at": "2025-...",
  "environment": {...}
}
```

### deployment-urls.txt
```
WORKER_URL=https://...
WIDGET_URL=https://...
```

These are used by the widget to find the API automatically.

## Managing Documents

### Upload New Documents

1. Place documents in `sample-documents/category/language/`:
   ```
   sample-documents/
   ├── fiction/
   │   ├── en/
   │   │   └── document.md
   │   └── de/
   │       └── dokument.md
   ```

2. Run upload script:
   ```bash
   # Upload/update documents only
   ./scripts/upload-documents.sh
   
   # Or sync with R2 (removes orphaned files)
   ./scripts/upload-documents.sh --sync
   ```
   
   See [Document Management Guide](./DOCUMENT_MANAGEMENT.md) for detailed usage.

### Document Formats Supported

- Markdown (.md)
- PDF (.pdf)
- Word (.docx)
- Excel (.xlsx)
- CSV (.csv)
- HTML (.html)
- Images (.png, .jpg, .jpeg)

## Troubleshooting

### Wrangler not found

Run the install script:
```bash
./scripts/install-dependencies.sh
```

Or install globally:
```bash
npm install -g wrangler
```

### R2 bucket not accessible

Check R2 is enabled:
1. Go to Cloudflare Dashboard → R2
2. Enable R2 if not already enabled
3. Verify bucket name in wrangler.toml

### Widget not loading

1. Check deployment URLs in deployment-config.json
2. Verify CORS headers in worker
3. Check browser console for errors

### AutoRAG not indexing

1. Verify AutoRAG instance ID in .env
2. Check AutoRAG dashboard for indexing status
3. Ensure documents are in correct format

## Local Development

### Run Worker Locally

```bash
cd worker
npm run dev
# API available at http://localhost:8787
```

### Build Widget Locally

```bash
cd widget
npm run build
# or watch mode:
npm run build -- --watch
```

### Test with Local API

Set in widget demo:
```javascript
window.AutoRAGConfig = {
  apiUrl: 'http://localhost:8787'
};
```

## Security Notes

- Never commit .env file
- API keys are stored as Worker secrets
- R2 bucket is private by default
- **CORS Configuration**:
  - Development: Defaults to wildcard (*) when ALLOWED_ORIGINS is not set
  - Production: Set ALLOWED_ORIGINS in wrangler.toml to restrict access
  - Example: `ALLOWED_ORIGINS = "https://yourdomain.com,https://app.yourdomain.com"`
- Widget uses DOMPurify for XSS protection

## Next Steps

1. **Customize Categories**: Edit sample-documents structure
2. **Add Languages**: Add new language folders
3. **Configure AI Models**: See [Model Configuration](./developers/model-configuration.md)
4. **Set Up Monitoring**: Configure Worker Analytics
5. **Custom Styling**: Modify widget/src/autorag-widget.js

## Support

- Documentation: [Documentation Hub](./README.md)
- Issues: Create an issue in the repository
- Cloudflare Support: For AutoRAG-specific issues