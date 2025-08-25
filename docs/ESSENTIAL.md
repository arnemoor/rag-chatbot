# AutoRAG Essential Documentation

## Quick Start

1. **Setup Environment**
   ```bash
   cp examples/.env.basic .env
   # Edit .env with your Cloudflare credentials
   ```

2. **Install & Deploy**
   ```bash
   ./scripts/install-dependencies.sh
   ./scripts/setup.sh
   ./scripts/deploy.sh
   ```

3. **Upload Documents**
   ```bash
   ./scripts/upload-library-documents.sh
   ```

## Configuration

### Required Environment Variables
- `CLOUDFLARE_ACCOUNT_ID` - Your account ID
- `CLOUDFLARE_API_TOKEN` - API token (see below)
- `AUTORAG_INSTANCE_ID` - AutoRAG instance name
- `R2_BUCKET_NAME` - R2 bucket for documents

### API Token Permissions
Create at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens):
- Account → Workers Scripts: Edit
- Account → Pages: Edit
- Account → R2 Storage: Edit
- Account → AI Gateway: Edit (optional)

## Project Structure
```
worker/     - Backend API
widget/     - Frontend widget
scripts/    - Deployment scripts
examples/   - Configuration examples
```

## Testing
```bash
./scripts/test-all.sh
```

## Troubleshooting

### CORS Errors
Set `ALLOWED_ORIGINS` in `.env` or leave empty for wildcard.

### No Results
Ensure documents are uploaded and AutoRAG has indexed them.

### Widget Not Appearing
Check `data-api-url` points to your worker URL.

## Scripts Reference

- `setup.sh` - Initial Cloudflare setup
- `deploy.sh` - Deploy worker and widget
- `upload-library-documents.sh` - Upload documents
- `test-all.sh` - Run all tests

## Contributing

1. Fork the repository
2. Create feature branch
3. Run tests: `./scripts/test-all.sh`
4. Submit pull request

See full guidelines in CONTRIBUTING.md