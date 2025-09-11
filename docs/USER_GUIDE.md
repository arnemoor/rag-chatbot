# User Guide - RAG Chatbot System

This guide is for business users who need to manage content and test the chatbot system after initial setup.

## Table of Contents
- [Overview](#overview)
- [Managing Documents with R2 Browser](#managing-documents-with-r2-browser)
- [Testing the Chatbot](#testing-the-chatbot)
- [Troubleshooting Empty Dropdowns](#troubleshooting-empty-dropdowns)
- [Step-by-Step: Setting Up Content for First Time](#step-by-step-setting-up-content-for-first-time)

## Overview

The RAG Chatbot system consists of three main components:
1. **R2 Browser** - Document management interface
2. **Playground** - Testing interface for the chatbot
3. **Widget** - The actual chatbot that appears on your website

### How Components Work Together

```
Documents in R2 → AutoRAG Indexing → Available in Chatbot
```

When you upload documents to R2:
1. Files are stored in organized folders
2. AutoRAG automatically processes them (or you can trigger manually)
3. Content becomes searchable in the chatbot
4. Language/Category dropdowns populate based on your folder structure

## Managing Documents with R2 Browser

### Accessing R2 Browser
Navigate to: `https://your-domain.pages.dev/r2browser.html`

### Understanding the Folder Structure

Documents must be organized in a 3-level hierarchy:
```
category/
  └── product/
      └── language/
          └── your-documents.pdf
```

**Example:**
```
fiction/
  └── literature/
      ├── en/
      │   ├── classic-novels.pdf
      │   └── reading-guide.md
      └── de/
          └── klassische-romane.pdf

support/
  └── technical/
      ├── en/
      │   └── troubleshooting.pdf
      └── fr/
          └── depannage.pdf
```

### Uploading Documents

1. **Create Category Folder** (if needed):
   - Click "📁 New Folder"
   - Enter category name (e.g., "fiction", "support", "products")
   - Click Create

2. **Create Product/Subcategory Folder**:
   - Navigate into the category folder
   - Click "📁 New Folder"
   - Enter product name (e.g., "literature", "technical", "user-guides")
   - Click Create

3. **Create Language Subfolder**:
   - Navigate into the product folder
   - Click "📁 New Folder"
   - Enter language code (en, de, fr, it)
   - Click Create

4. **Upload Files**:
   - Navigate to the correct category/product/language folder
   - Click "📤 Upload Files"
   - Select your documents (PDF, DOCX, MD, TXT, HTML)
   - Files upload automatically

### The Re-index Button

The **🔍 Re-index** button triggers AutoRAG to process your documents:

- **When to use it:**
  - After uploading new documents
  - If documents aren't appearing in search
  - After deleting documents
  - When dropdowns show "No items available"

- **What happens when clicked:**
  1. Button shows "⏳ Indexing..."
  2. AutoRAG processes all documents
  3. Button shows "✅ Indexed!" when complete
  4. You receive a Job ID for tracking

- **Processing time:**
  - Small documents (< 10): 1-2 minutes
  - Medium library (10-50): 3-5 minutes
  - Large library (50+): 5-10 minutes

### Deleting Documents

1. Navigate to the file
2. Click "Delete" button next to the file
3. Confirm deletion
4. Click "🔍 Re-index" to update the search index

## Testing the Chatbot

### Using the Playground

Navigate to: `https://your-domain.pages.dev/playground.html`

#### Understanding the Dropdowns

The three main dropdowns control what content the chatbot searches:

1. **Language Dropdown**
   - Shows available languages based on your folders
   - Example: "English (English)", "Deutsch (German)"
   - Empty? No language folders exist in R2

2. **Category Dropdown**
   - Shows content categories from your folder structure
   - Example: "Products", "Support", "Documentation"
   - Empty? No category folders exist in R2

3. **Product Dropdown**
   - Shows subcategories within the selected category
   - Filters based on category selection
   - Shows "No products available" if category has no subfolders

#### Testing Your Content

1. **Select Configuration:**
   - Choose Language (e.g., "English")
   - Choose Category (e.g., "products")
   - Choose Product (if available)

2. **Ask Test Questions:**
   - Use the sample questions provided
   - Or type your own questions
   - Click "Send" or press Enter

3. **Verify Responses:**
   - Check if answers come from your documents
   - Look for citations/sources in responses
   - Test in different languages

## Troubleshooting Empty Dropdowns

### Scenario: "No languages available"

**Cause:** No properly structured folders in R2

**Solution:**
1. Go to R2 Browser
2. Create folder structure: `category/product/language/`
3. Upload at least one document
4. Click "🔍 Re-index"
5. Wait 2-3 minutes
6. Refresh Playground - dropdowns should populate

### Scenario: "No categories available"

**Cause:** Documents not indexed yet

**Solution:**
1. Click "🔍 Re-index" in R2 Browser
2. Wait for "✅ Indexed!" confirmation
3. Refresh Playground page

### Scenario: "No products available"

**Cause:** Selected category has no content

**Solution:**
1. Verify folder structure in R2 Browser
2. Ensure documents exist in `category/product/language/` folders
3. Re-index if needed

## Step-by-Step: Setting Up Content for First Time

### For a Fresh Installation:

#### Step 1: Access R2 Browser
```
https://your-domain.pages.dev/r2browser.html
```

#### Step 2: Create Your First Category
1. Click "📁 New Folder"
2. Enter: `support` (or your category name)
3. Click Create

#### Step 3: Add Product/Subcategory Folder
1. Click on `support/` to enter the folder
2. Click "📁 New Folder"
3. Enter: `technical` (or your product name)
4. Click Create

#### Step 4: Add Language Folder
1. Click on `technical/` to enter the folder
2. Click "📁 New Folder"
3. Enter: `en` (for English)
4. Click Create

#### Step 5: Upload Your First Document
1. Navigate to `support/technical/en/`
2. Click "📤 Upload Files"
3. Select a PDF or document
4. Wait for upload completion

#### Step 6: Trigger Indexing
1. Click "🔍 Re-index" button
2. Note the Job ID shown
3. Wait 2-3 minutes for processing

#### Step 7: Test in Playground
1. Open: `https://your-domain.pages.dev/playground.html`
2. Language dropdown should show "English"
3. Category dropdown should show "Support"
4. Product dropdown should show "Technical"
5. Select all three and test with questions

#### Step 8: Verify on Demo Page
1. Open: `https://your-domain.pages.dev/demo.html`
2. Configure the widget settings
3. Click the chat button
4. Test asking questions about your uploaded content

### Content Best Practices

#### Document Preparation
- **File Names:** Use descriptive names (e.g., `user-manual-v2.pdf`)
- **File Formats:** PDF and Markdown work best
- **File Size:** Keep under 10MB per file
- **Content Structure:** Use clear headings and sections

#### Folder Organization
```
products/
  ├── en/
  │   ├── product-a-manual.pdf
  │   ├── product-a-specs.pdf
  │   └── product-a-faq.md
  └── de/
      ├── produkt-a-handbuch.pdf
      └── produkt-a-faq.md

support/
  ├── en/
  │   ├── troubleshooting.pdf
  │   └── contact-info.md
  └── fr/
      └── depannage.pdf
```

#### Language Codes
- `en` - English
- `de` - German (Deutsch)
- `fr` - French (Français)
- `it` - Italian (Italiano)
- `es` - Spanish (Español)

### Monitoring Indexing Status

After clicking "🔍 Re-index":

1. **Immediate Feedback:**
   - Button changes to "⏳ Indexing..."
   - Alert shows Job ID

2. **Check Progress:**
   - Log into Cloudflare Dashboard
   - Navigate to: AI → AutoRAG → Jobs
   - Find your Job ID
   - Monitor processing status

3. **Completion Indicators:**
   - Button shows "✅ Indexed!"
   - Dropdowns populate in Playground
   - Content searchable in chatbot

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Dropdowns empty after upload | Documents not indexed | Click "🔍 Re-index" and wait |
| Uploaded files not searchable | Wrong folder structure | Check: `category/product/language/file` |
| Re-index button shows error | Missing credentials | Contact administrator |
| Documents in wrong language | Incorrect language folder | Move to correct `/en/`, `/de/`, etc. |
| Chatbot gives generic answers | Content not indexed | Re-index and wait 5 minutes |

## Tips for Business Users

### Daily Operations
1. **Morning Check:** Open Playground, verify dropdowns are populated
2. **After Uploads:** Always click "🔍 Re-index"
3. **Testing:** Try questions in different languages
4. **Monitoring:** Check R2 Browser file count matches expectations

### Content Management
- **Updates:** Delete old file → Upload new → Re-index
- **Translations:** Keep same filename across languages
- **Categories:** Start with few, expand as needed
- **Backup:** Keep local copies of all uploaded documents

### Quality Assurance
1. Test each language after uploading
2. Verify category filtering works
3. Check response accuracy
4. Document any issues with specific files

## Need Help?

- **Technical Issues:** Contact your IT administrator
- **Content Questions:** Refer to uploaded document guidelines
- **System Status:** Check Cloudflare Dashboard → AutoRAG
- **Feature Requests:** Document and share with development team