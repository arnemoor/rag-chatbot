# AutoRAG - Open Source RAG Chatbot Framework

An open-source RAG (Retrieval-Augmented Generation) chatbot framework built on Cloudflare's infrastructure. Deploy your own AI-powered document Q&A system in minutes.

> **Framework Note**: This is an open-source framework designed for evaluation, demonstration, and rapid deployment. By default, it runs in permissive mode to facilitate testing and integration. See [Security Configuration](./docs/SECURITY.md) for production hardening options.

## ✨ Features

- 🚀 **One-Command Deployment** - Deploy to your Cloudflare account with a single script
- 🌍 **Multi-Language Support** - EN, DE, FR, IT with automatic language detection
- 📚 **Smart Document Organization** - Category and product-based document structure
- 🤖 **Multiple AI Models** - Workers AI, OpenAI, and Anthropic support
- 🎨 **Embeddable Widget** - Drop into any website with two lines of code
- 📁 **R2 Storage Integration** - Scalable document storage
- 🔍 **AutoRAG Indexing** - Automatic document indexing and retrieval
- 🎮 **Interactive Playground** - Test configurations before deployment

## 🚀 Quick Start

### Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+ and npm (Node 20+ recommended for all features)
- Git

### Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/arnemoor/rag-chatbot.git
cd rag-chatbot

# 2. Follow the setup guide
# See docs/SETUP.md for detailed instructions
```

📖 **[Complete Setup Guide →](docs/SETUP.md)**

**Manual steps required:**
1. Create AutoRAG instance in Cloudflare Dashboard
2. Create API Token with proper permissions
3. Copy credentials to .env file

**Automated by scripts:**
- R2 bucket creation
- Worker deployment
- Widget deployment
- URL configuration

## 📋 What You'll Get

After deployment, you'll receive:
- **Your Worker API URL**: `https://your-worker.workers.dev`
- **Your Widget URL**: `https://your-widget.pages.dev`
- **Integration code** for your website
- **Direct links** to playground, demo, and tools

## 🔧 Integration

Add the chatbot to any website:

```html
<script src="https://your-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget></autorag-widget>
```

With custom configuration:

```html
<autorag-widget 
  language="en"
  category="fiction"
  theme="dark"
  position="bottom-right">
</autorag-widget>
```

## 🏗️ Architecture

```
Your Cloudflare Account
├── Worker (API Backend)
│   ├── AutoRAG Integration
│   ├── Document Processing
│   └── Chat Endpoints
├── Pages (Widget Frontend)
│   ├── Embeddable Widget
│   ├── Standalone Chat
│   └── Admin Tools
└── R2 Storage
    └── Document Storage
```

## 📁 Project Structure

```
rag-chatbot/
├── worker/              # Backend API (Cloudflare Worker)
├── widget/              # Embeddable widget (Cloudflare Pages)  
├── scripts/             # Deployment and utility scripts
├── docs/                # Documentation
├── examples/            # Configuration examples
├── sample-documents/    # Sample documents for testing
└── README.md           # Quick start guide
```

## 🔐 Configuration

### Required Cloudflare Settings

1. **Account ID**: Found in Cloudflare Dashboard → Right sidebar
2. **API Token**: Create at Profile → API Tokens with permissions:
   - AutoRAG: Read/Write
   - R2: Read/Write
   - Workers: Edit
   - Pages: Edit

### Optional AI Providers

Add to `.env` for external models:
```env
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
```

## 📚 Documentation

- [Documentation Hub](./docs/README.md) - All documentation
- [Quick Start Guide](./docs/ESSENTIAL.md) - Get started in 5 minutes
- [API Token Setup](./docs/API_TOKEN_SETUP.md) - Configure permissions
- [Security Configuration](./docs/SECURITY.md) - Security options and production hardening
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues

## 🎯 Use Cases

- **Customer Support** - AI-powered support chatbot
- **Documentation Assistant** - Interactive documentation helper
- **Knowledge Base** - Searchable knowledge base with AI
- **Educational Platform** - Course material Q&A system
- **Internal Tools** - Employee handbook assistant

## 🛠️ Development

### Local Development

```bash
# Install all dependencies
./scripts/install-dependencies.sh

# Start Worker locally
cd worker
npm run dev

# Build Widget
cd widget
npm run build -- --watch

# Run all tests
./scripts/test-all.sh
```

### Adding Documents

Upload documents to R2:
```bash
# Upload sample documents
./scripts/upload-library-documents.sh

# Or upload your own files
cd worker
npx wrangler r2 object put your-bucket/document.pdf --file=../path/to/document.pdf
```

Documents are automatically indexed by AutoRAG after upload.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🆘 Support

- **Documentation**: [Documentation Hub](./docs/README.md)
- **Issues**: Report issues in your fork
- **Discussions**: Use your preferred communication channel

## 🙏 Acknowledgments

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com)
- [Cloudflare AutoRAG](https://developers.cloudflare.com/vectorize/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages](https://pages.cloudflare.com)

---

**Note**: This is an open source template. When you deploy it, all services run on YOUR Cloudflare infrastructure with YOUR URLs. No data or requests go to the original authors.