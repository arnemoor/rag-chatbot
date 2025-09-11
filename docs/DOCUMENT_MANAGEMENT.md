# Document Management Guide

This guide explains how to manage documents in your AutoRAG R2 bucket using both the web interface and command-line tools.

## Table of Contents

- [Overview](#overview)
- [Document Structure](#document-structure)
- [R2 Browser Web Interface](#r2-browser-web-interface)
  - [Accessing the R2 Browser](#accessing-the-r2-browser)
  - [Managing Files and Folders](#managing-files-and-folders)
  - [Re-indexing Documents](#re-indexing-documents)
- [Command-Line Upload Script](#command-line-upload-script)
  - [Basic Upload](#basic-upload-default)
  - [Full Sync Mode](#full-sync-mode)
- [How It Works with the Chatbot](#how-it-works-with-the-chatbot)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

You can manage documents in your R2 bucket using two methods:

1. **R2 Browser (Web Interface)** - User-friendly interface for uploading, organizing, and indexing documents
2. **Upload Script (Command Line)** - Automated tool for bulk operations and synchronization

Both methods work with the same R2 bucket and AutoRAG indexing system.

## Document Structure

Documents must be organized in a 3-level hierarchy:

```
sample-documents/
├── category/           # Top-level category (e.g., fiction, support, products)
│   └── product/       # Product or subcategory (e.g., literature, technical)
│       ├── en/        # Language folder (en, de, fr, it)
│       │   └── document.md
│       ├── de/
│       │   └── document.md
│       ├── fr/
│       │   └── document.md
│       └── it/
│           └── document.md
```

## R2 Browser Web Interface

The R2 Browser provides a visual interface for managing your documents directly from your web browser.

### Accessing the R2 Browser

Navigate to: `https://your-domain.pages.dev/r2browser.html`

### Interface Overview

The R2 Browser displays:
- **Current Path**: Shows your location in the folder hierarchy
- **Action Buttons**: New Folder, Upload Files, Refresh, Re-index
- **File List**: Shows folders and files with their sizes
- **Statistics**: Total files and storage used

### Managing Files and Folders

#### Creating Folders

1. Click **📁 New Folder** button
2. Enter the folder name (e.g., "fiction", "en", "products")
3. Click Create
4. Navigate into the folder by clicking on it

**Important**: Follow the required 3-level structure:
- First level: Category (e.g., "fiction", "support")
- Second level: Product/Subcategory (e.g., "literature", "technical")
- Third level: Language code (e.g., "en", "de", "fr")
- Fourth level: Your documents

#### Uploading Files

1. Navigate to the correct `category/product/language/` folder
2. Click **📤 Upload Files** button
3. Select one or multiple files
4. Files upload automatically with progress indication
5. Supported formats: PDF, DOCX, MD, TXT, HTML, CSV, XLSX

#### Deleting Files

1. Find the file in the list
2. Click the **Delete** button next to the file
3. Confirm deletion when prompted
4. File is immediately removed from R2

#### Refreshing the View

Click **🔄 Refresh** to update the file list if changes were made outside the browser.

### Re-indexing Documents

The **🔍 Re-index** button triggers AutoRAG to process your documents for the chatbot.

#### When to Re-index

You should re-index after:
- Uploading new documents
- Deleting documents
- Updating existing documents
- When chatbot isn't finding your content

#### How Re-indexing Works

1. Click the **🔍 Re-index** button
2. Button changes to "⏳ Indexing..." 
3. AutoRAG processes all documents in R2
4. You receive a Job ID for tracking
5. Button shows "✅ Indexed!" when complete
6. Processing typically takes 2-5 minutes

#### What Happens During Indexing

- Documents are converted to searchable text
- Content is split into chunks for better retrieval
- Vector embeddings are created for semantic search
- Language and category metadata is extracted
- Dropdowns in the Playground populate based on your content

### Impact on Chatbot Dropdowns

The folder structure directly affects what appears in the chatbot interface:

| Your Folders | → | Playground Dropdowns |
|--------------|---|---------------------|
| `/fiction/literature/en/` | → | Language: "English", Category: "Fiction", Product: "Literature" |
| `/support/technical/de/` | → | Language: "Deutsch", Category: "Support", Product: "Technical" |
| `/products/hardware/fr/` | → | Language: "Français", Category: "Products", Product: "Hardware" |

If dropdowns show "No items available", you need to:
1. Ensure proper folder structure exists
2. Upload at least one document
3. Click Re-index and wait for completion

## Command-Line Upload Script

For bulk operations and automation, use the `upload-documents.sh` script.

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

After upload, the script automatically triggers AutoRAG indexing to process the new/updated documents (same as clicking Re-index in the R2 Browser).

### 4. Progress Tracking

The script provides colored output showing:
- 🟡 Current operations
- ✅ Successful uploads/deletions
- ❌ Failed operations
- ⚠️ Warnings (files to be deleted)

## How It Works with the Chatbot

### The Complete Flow

```
1. Upload Documents → 2. Re-index → 3. Available in Chatbot
```

#### Step 1: Document Upload
- Use R2 Browser or upload script
- Files stored in R2 bucket
- Must follow category/product/language structure

#### Step 2: Indexing Process
- Triggered by Re-index button or script
- AutoRAG processes all documents
- Creates searchable index
- Extracts metadata for filtering

#### Step 3: Chatbot Availability
- Playground dropdowns populate
- Language dropdown shows available languages
- Category dropdown shows document categories
- Chatbot can answer questions from your content

### Understanding Empty Dropdowns

When you first set up or see "No items available":

| Symptom | Cause | Solution |
|---------|-------|----------|
| "No languages available" | No documents indexed | Upload docs → Re-index |
| "No categories available" | Wrong folder structure | Check category/product/language folders |
| "No products available" | No subcategories | This is optional, can be empty |
| Chatbot gives generic answers | Content not indexed | Re-index and wait 5 minutes |

### Testing Your Setup

1. **Upload a Test Document**:
   - Create folders: `test/sample/en/`
   - Upload a simple PDF or text file
   - Click Re-index

2. **Check Playground** (after 2-3 minutes):
   - Language dropdown should show "English"
   - Category dropdown should show "Test"
   - Ask a question about your document

3. **Verify Responses**:
   - Chatbot should reference your document
   - Answers should be specific to your content

## Common Scenarios

### Adding New Documents

1. Place documents in the appropriate folder structure:
   ```bash
   sample-documents/technology/ai/en/machine-learning.md
   ```
   (Note: This follows the pattern: category/product/language/filename)

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