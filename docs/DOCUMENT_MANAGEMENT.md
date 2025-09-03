# Document Management Guide

This guide explains how to manage documents in your AutoRAG R2 bucket, including uploading, updating, and synchronizing documents.

## Overview

The `upload-documents.sh` script manages documents in your R2 bucket, supporting both incremental updates and full synchronization with your local document repository.

## Document Structure

Documents must be organized in a 3-level hierarchy:

```
sample-documents/
├── category/           # Top-level category (e.g., fiction, technology)
│   ├── product/       # Product or subcategory (e.g., novels, programming)
│   │   ├── en/        # Language folder (en, de, fr, it)
│   │   │   └── document.md
│   │   ├── de/
│   │   ├── fr/
│   │   └── it/
```

## Upload Script Usage

### Basic Upload (Default)

Uploads or updates documents without deleting orphaned files:

```bash
./scripts/upload-documents.sh
```

This mode:
- ✅ Uploads new documents
- ✅ Updates existing documents
- ❌ Does NOT delete files from R2 that no longer exist locally

### Full Sync Mode

Synchronizes R2 with your local documents, including deletion of orphaned files:

```bash
./scripts/upload-documents.sh --sync
```

This mode:
- ✅ Uploads new documents
- ✅ Updates existing documents
- ✅ Deletes files from R2 that no longer exist locally
- ⚠️ Asks for confirmation before deleting files

### Help

View usage information:

```bash
./scripts/upload-documents.sh --help
```

## Features

### 1. Automatic Document Discovery

The script automatically discovers all documents in the `sample-documents` directory based on the folder structure.

### 2. Orphan Detection (Sync Mode)

When using `--sync`, the script:
1. Lists all files currently in R2
2. Compares with local files being uploaded
3. Identifies orphaned files (exist in R2 but not locally)
4. Shows list of files to be deleted
5. Asks for confirmation before deletion

### 3. AutoRAG Indexing

After upload, the script automatically triggers AutoRAG indexing to process the new/updated documents.

### 4. Progress Tracking

The script provides colored output showing:
- 🟡 Current operations
- ✅ Successful uploads/deletions
- ❌ Failed operations
- ⚠️ Warnings (files to be deleted)

## Common Scenarios

### Adding New Documents

1. Place documents in the appropriate folder structure:
   ```bash
   sample-documents/technology/ai/en/machine-learning.md
   ```

2. Run the upload script:
   ```bash
   ./scripts/upload-documents.sh
   ```

### Updating Existing Documents

1. Edit the document locally
2. Run the upload script:
   ```bash
   ./scripts/upload-documents.sh
   ```

### Removing Documents

1. Delete the document locally
2. Run sync mode to remove from R2:
   ```bash
   ./scripts/upload-documents.sh --sync
   ```
3. Confirm deletion when prompted

### Complete Repository Sync

To ensure R2 exactly matches your local documents:

```bash
./scripts/upload-documents.sh --sync
```

## Environment Requirements

The script requires these environment variables in your `.env` file:

```env
# Required
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
R2_BUCKET_NAME=your-bucket-name
AUTORAG_INSTANCE_ID=your-autorag-id

# Optional
PAGES_PROJECT_NAME=autorag-widget
```

## R2 Location

The script always uploads to the **remote** R2 instance (production), never to local/development instances. This ensures consistency across deployments.

## Troubleshooting

### "Failed to trigger indexing"

This error occurs when AutoRAG cannot be reached. Check:
- AUTORAG_INSTANCE_ID is correct
- API token has AutoRAG permissions
- AutoRAG instance exists and is active

### "No orphaned files found" in sync mode

This is normal and means R2 is already synchronized with your local files.

### Files not updating in the chatbot

After upload:
1. Check the AutoRAG Jobs dashboard for indexing status
2. Wait for indexing to complete (usually 1-2 minutes)
3. Clear browser cache if testing the widget

### Permission errors

Ensure your API token has these permissions:
- R2: Read and Write
- AutoRAG: Read and Write

## Best Practices

### Regular Syncing

Run sync mode periodically to keep R2 clean:
```bash
./scripts/upload-documents.sh --sync
```

### Document Naming

Use descriptive filenames that indicate content:
- ✅ `library-cataloging-standards.md`
- ❌ `doc1.md`

### Language Consistency

Ensure each document set has translations in all supported languages (en, de, fr, it).

### Version Control

Commit document changes to Git before uploading to maintain history:
```bash
git add sample-documents/
git commit -m "Update documentation content"
./scripts/upload-documents.sh
```

## Advanced Usage

### Dry Run (Future Enhancement)

A `--dry-run` option could be added to preview changes without executing them.

### Selective Upload (Future Enhancement)

Support for uploading specific categories or languages could be added:
```bash
# Potential future feature
./scripts/upload-documents.sh --category=technology --language=en
```

## Security Notes

- Documents in R2 are private by default
- The worker controls access to documents
- Never commit sensitive information to documents
- Use appropriate permissions on API tokens

## Related Documentation

- [Setup Guide](./SETUP.md) - Initial project setup
- [API Token Setup](./API_TOKEN_SETUP.md) - Configure API permissions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions