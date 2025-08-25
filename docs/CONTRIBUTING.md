# Contributing to AutoRAG Clean

Thank you for your interest in contributing to AutoRAG Clean! This document provides guidelines and instructions for contributing to the project.

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Git
- Basic knowledge of TypeScript and JavaScript

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/auto-rag-clean.git
   cd auto-rag-clean
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd worker && npm install && cd ..
   cd widget && npm install && cd ..
   ```

3. **Set Up Environment Variables**
   ```bash
   cp examples/.env.basic .env
   # Edit .env with your Cloudflare credentials
   ```

4. **Run Tests**
   ```bash
   npm test  # Run all tests
   ```

## 🏗️ Project Structure

```
auto-rag-clean/
├── worker/                 # Backend API (TypeScript)
│   ├── src/
│   │   ├── middleware/    # Request middleware
│   │   ├── routes/        # API endpoints
│   │   └── utils/         # Utility functions
│   └── tests/
├── widget/                 # Frontend widget (JavaScript)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── dist/              # Built files
└── documentation/          # Project documentation
```

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code patterns
- Add comments for complex logic
- Update tests as needed

### 3. Run Quality Checks

```bash
# Run tests
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### 4. Test Your Changes

#### Worker Testing
```bash
cd worker
npm run dev  # Start local development server
# Test at http://localhost:8787
```

#### Widget Testing
```bash
cd widget
npm run build  # Build the widget
npm run serve  # Serve demo page
# Open http://localhost:3000
```

### 5. Commit Your Changes

We use conventional commits. Format your commit messages as:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

Examples:
```bash
git commit -m "feat(worker): add rate limiting support"
git commit -m "fix(widget): resolve theme switching issue"
git commit -m "docs: update installation instructions"
```

## 🧪 Testing Guidelines

### Writing Tests

1. **Worker Tests** (Vitest)
   ```typescript
   // worker/src/routes/example.test.ts
   import { describe, it, expect } from 'vitest';
   
   describe('Example Route', () => {
     it('should handle requests correctly', async () => {
       // Test implementation
     });
   });
   ```

2. **Widget Tests** (Vitest + Testing Library)
   ```javascript
   // widget/src/components/example.test.js
   import { describe, it, expect } from 'vitest';
   import { fireEvent, waitFor } from '@testing-library/dom';
   
   describe('Example Component', () => {
     it('should render correctly', () => {
       // Test implementation
     });
   });
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run worker tests
npm run test:worker

# Run widget tests  
npm run test:widget

# Run tests in watch mode
npm run test:watch
```

## 💅 Code Style

### TypeScript (Worker)

- Use TypeScript for type safety
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use async/await over promises

### JavaScript (Widget)

- Use ES6+ features
- Use template literals for strings
- Use arrow functions for callbacks
- Use destructuring when appropriate

### General

- Keep functions small and focused
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Follow existing patterns in the codebase

## 📚 Documentation

### Code Documentation

Add JSDoc comments for:
- Public functions
- Complex algorithms
- API endpoints
- Configuration options

Example:
```typescript
/**
 * Processes chat messages through AutoRAG
 * @param query - User's question
 * @param language - Language code (en, de, fr, it)
 * @param category - Document category
 * @returns Chat response with citations
 */
export async function processChat(
  query: string,
  language: string,
  category: string
): Promise<ChatResponse> {
  // Implementation
}
```

### Updating Documentation

When adding features or making changes:
1. Update relevant README files
2. Update API documentation if endpoints change
3. Add examples for new features
4. Update configuration documentation

## 🐛 Reporting Issues

### Before Creating an Issue

1. Check existing issues
2. Try reproducing with latest version
3. Search documentation

### Creating an Issue

Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages or logs
- Screenshots if applicable

## 🚀 Pull Request Process

1. **Ensure all tests pass**
2. **Update documentation** as needed
3. **Add tests** for new functionality
4. **Verify backward compatibility**
5. **Request review** from maintainers

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Backward compatible
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with main

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

## 📮 Getting Help

- **Issues**: Report bugs

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AutoRAG Clean! 🎉