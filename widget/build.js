const fs = require('fs');
const path = require('path');

const esbuild = require('esbuild');

// Check for watch mode
const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build configuration
const buildConfig = {
  entryPoints: ['src/autorag-widget.js'],
  bundle: true,
  minify: true,
  sourcemap: false,
  outfile: 'dist/autorag-widget.min.js',
  format: 'iife',
  target: ['es2020'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
};

async function build() {
  try {
    if (isWatch) {
      // Watch mode
      const ctx = await esbuild.context(buildConfig);
      await ctx.watch();
      console.log('👀 Watching for changes...');
    } else {
      // Single build
      await esbuild.build(buildConfig);

      // Create unminified version for debugging
      await esbuild.build({
        ...buildConfig,
        minify: false,
        outfile: 'dist/autorag-widget.js',
      });

      // Create CDN-ready HTML file for iframe fallback
      createIframeVersion();

      // Create loader snippet
      createLoaderSnippet();

      // Copy HTML files to dist
      copyHTMLFiles();

      // Copy deployment config if it exists
      copyDeploymentConfig();

      // Create _headers file for Cloudflare Pages
      const headersContent = `/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type`;

      fs.writeFileSync(path.join(distDir, '_headers'), headersContent);

      // Don't create _redirects file - let Cloudflare Pages handle HTML files naturally

      console.log('✅ Build complete!');
      console.log('📦 Files created:');
      console.log('   - dist/autorag-widget.min.js (minified)');
      console.log('   - dist/autorag-widget.js (debug)');
      console.log('   - dist/iframe.html (iframe fallback)');
      console.log('   - dist/loader.html (integration snippet)');
      console.log('   - dist/r2browser.html (R2 bucket browser)');
      console.log('   - dist/demo.html (demo page)');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

function createIframeVersion() {
  const iframeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{MARKETING_NAME}} Chat Widget</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #widget-container {
      flex: 1;
      position: relative;
    }
  </style>
</head>
<body>
  <div id="widget-container"></div>
  <script src="autorag-widget.min.js"></script>
  <script>
    // Parse URL parameters for configuration
    const params = new URLSearchParams(window.location.search);
    const widget = document.createElement('autorag-widget');
    
    // Apply parameters as attributes
    params.forEach((value, key) => {
      widget.setAttribute(key, value);
    });
    
    // Always expanded in iframe mode
    widget.setAttribute('minimized', 'false');
    widget.style.position = 'relative';
    
    document.getElementById('widget-container').appendChild(widget);
  </script>
</body>
</html>`;

  // Replace placeholders
  const marketingName = process.env.MARKETING_NAME || 'AutoRAG';
  const cleanMarketingName = marketingName.replace(/^["']|["']$/g, '').split(' (')[0];
  const processedHTML = iframeHTML.replace(/\{\{MARKETING_NAME\}\}/g, cleanMarketingName);
  
  fs.writeFileSync('dist/iframe.html', processedHTML);
}

function createLoaderSnippet() {
  const loaderHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{MARKETING_NAME}} Widget Integration</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      line-height: 1.6;
    }
    pre {
      background: #f4f4f4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    code {
      background: #f4f4f4;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .method {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    h2 {
      color: #2563eb;
    }
  </style>
</head>
<body>
  <h1>{{MARKETING_NAME}} Widget Integration Guide</h1>
  
  <div class="method">
    <h2>Method 1: Simple Embedding</h2>
    <p>Add these two lines to your HTML:</p>
    <pre><code>&lt;script src="https://your-domain.pages.dev/autorag-widget.min.js"&gt;&lt;/script&gt;
&lt;autorag-widget&gt;&lt;/autorag-widget&gt;</code></pre>
  </div>
  
  <div class="method">
    <h2>Method 2: With Configuration</h2>
    <p>Customize the widget with attributes:</p>
    <pre><code>&lt;script src="https://your-domain.pages.dev/autorag-widget.min.js"&gt;&lt;/script&gt;
&lt;autorag-widget
  language="de"
  category="fiction"
  product="product-a"
  model="openai|gpt-4o-mini"
  theme="dark"
  position="bottom-left"
  button-text="Hilfe benötigt?"
  header-title="Support Chat"
&gt;&lt;/autorag-widget&gt;</code></pre>
  </div>
  
  <div class="method">
    <h2>Method 3: Programmatic Configuration</h2>
    <p>Configure via JavaScript before loading:</p>
    <pre><code>&lt;script&gt;
window.AutoRAGConfig = {
  language: 'en',
  category: 'science',
  product: 'product-a',
  provider: 'openai',
  model: 'gpt-5-mini',
  theme: 'light',
  position: 'bottom-right',
  buttonText: 'Need Help?',
  headerTitle: 'Support Assistant',
  autoInit: true
};
&lt;/script&gt;
&lt;script src="https://your-domain.pages.dev/autorag-widget.min.js"&gt;&lt;/script&gt;</code></pre>
  </div>
  
  <div class="method">
    <h2>Method 4: Iframe Embedding (Legacy)</h2>
    <p>For complete isolation or legacy browser support:</p>
    <pre><code>&lt;iframe
  src="https://your-domain.pages.dev/iframe.html?language=en&category=general&product=product-a"
  width="400"
  height="600"
  frameborder="0"
&gt;&lt;/iframe&gt;</code></pre>
  </div>
  
  <div class="method">
    <h2>Available Configuration Options</h2>
    <ul>
      <li><code>language</code>: en, de, fr, it</li>
      <li><code>category</code>: fiction, non-fiction, science, technology, history, general</li>
      <li><code>product</code>: product-a, product-b</li>
      <li><code>provider</code>: workers-ai, openai, anthropic</li>
      <li><code>model</code>: Model identifier</li>
      <li><code>theme</code>: light, dark</li>
      <li><code>position</code>: bottom-right, bottom-left, top-right, top-left</li>
      <li><code>button-text</code>: Custom button text</li>
      <li><code>header-title</code>: Custom header title</li>
      <li><code>api-url</code>: Custom API endpoint (for self-hosted)</li>
    </ul>
  </div>
  
  <div class="method">
    <h2>Event Listeners</h2>
    <p>Listen to widget events:</p>
    <pre><code>&lt;script&gt;
const widget = document.querySelector('autorag-widget');

widget.addEventListener('widget-opened', (e) => {
  console.log('Chat opened', e.detail);
});

widget.addEventListener('widget-closed', (e) => {
  console.log('Chat closed', e.detail);
});

widget.addEventListener('message-sent', (e) => {
  console.log('Message sent', e.detail);
});

widget.addEventListener('widget-error', (e) => {
  console.error('Error occurred', e.detail);
});
&lt;/script&gt;</code></pre>
  </div>
</body>
</html>`;

  // Replace placeholders
  const marketingName = process.env.MARKETING_NAME || 'AutoRAG';
  const cleanMarketingName = marketingName.replace(/^["']|["']$/g, '').split(' (')[0];
  const processedHTML = loaderHTML.replace(/\{\{MARKETING_NAME\}\}/g, cleanMarketingName);
  
  fs.writeFileSync('dist/loader.html', processedHTML);
}

function copyDeploymentConfig() {
  // Copy deployment-config.json if it exists
  const configPath = path.join(__dirname, '..', 'deployment-config.json');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    fs.writeFileSync(path.join(distDir, 'deployment-config.json'), configContent);
    console.log('   - dist/deployment-config.json (deployment configuration)');
  }
}

function copyHTMLFiles() {
  const srcDir = path.join(__dirname, 'src');
  
  // Get marketing name from environment or use default
  const marketingName = process.env.MARKETING_NAME || 'AutoRAG';
  // Clean up the marketing name - remove quotes and take only the first part if it has parentheses
  const cleanMarketingName = marketingName.replace(/^["']|["']$/g, '').split(' (')[0];

  // Process template files
  const templateFiles = ['demo.template.html', 'r2browser.template.html', 'playground.template.html', 'iframe.template.html'];
  templateFiles.forEach((templateFile) => {
    const templatePath = path.join(srcDir, templateFile);
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      
      // Replace {{MARKETING_NAME}} placeholder with actual marketing name
      content = content.replace(/\{\{MARKETING_NAME\}\}/g, cleanMarketingName);
      
      // Generate the output filename (remove .template from the name)
      const outputFile = templateFile.replace('.template', '');
      
      // Write to both src (for development) and dist (for deployment)
      fs.writeFileSync(path.join(srcDir, outputFile), content);
      fs.writeFileSync(path.join(distDir, outputFile), content);
      console.log(`   - dist/${outputFile}`);
    }
  });
  
  // Copy other static HTML files that don't have templates
  const staticFiles = ['index.html'];
  staticFiles.forEach((file) => {
    const srcPath = path.join(srcDir, file);
    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf8');
      fs.writeFileSync(path.join(distDir, file), content);
      console.log(`   - dist/${file}`);
    }
  });
}

// Run build
build();
