class ChatbotClient {
  constructor() {
    // Configuration - API_URL must be loaded from config.js
    this.workerUrl = null;
    this.configLoaded = false;
    
    // State
    this.sessionId = null;
    this.isLoading = false;
    this.messageHistory = [];
    
    // Initialize after loading configuration
    this.init();
  }
  
  async init() {
    try {
      // Load API URL from configuration
      await loadApiUrl();
      this.workerUrl = API_URL;
      this.configLoaded = true;
      
      // Initialize the rest
      this.initializeElements();
      this.loadDynamicCategories();
      this.attachEventListeners();
      this.startNewSession();
    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      this.showConfigurationError();
    }
  }
  
  showConfigurationError() {
    const errorHtml = `
      <div style="padding: 20px; background: #fee; color: #c00; border-radius: 8px; margin: 20px;">
        <h3>Configuration Error</h3>
        <p>The chatbot is not configured. Please run the deployment script to set up the API endpoint.</p>
        <p>See the documentation for setup instructions.</p>
      </div>
    `;
    document.getElementById('messages').innerHTML = errorHtml;
  }
  
  initializeElements() {
    this.elements = {
      // Controls
      languageSelect: document.getElementById('language-select'),
      categorySelect: document.getElementById('category-select'),
      productSelect: document.getElementById('product-select'),
      modelSelect: document.getElementById('model-select'),
      newSessionBtn: document.getElementById('new-session-btn'),
      
      // Chat
      messagesDiv: document.getElementById('messages'),
      citationsDiv: document.getElementById('citations'),
      userInput: document.getElementById('user-input'),
      sendBtn: document.getElementById('send-btn'),
      
      // Status
      statusIndicator: document.getElementById('status-indicator'),
      statusText: document.getElementById('status-text'),
      sessionIdSpan: document.getElementById('session-id'),
    };
  }
  
  async loadDynamicCategories() {
    try {
      const response = await fetch(`${this.workerUrl}/categories`);
      if (response.ok) {
        const data = await response.json();
        this.populateCategorySelect(data.categories);
      } else {
        console.warn('Failed to load categories, using fallback');
        this.populateCategorySelect(['fiction', 'non-fiction', 'science', 'technology', 'reference']);
      }
    } catch (error) {
      console.warn('Error loading categories:', error);
      this.populateCategorySelect(['fiction', 'non-fiction', 'science', 'technology', 'reference']);
    }
  }
  
  populateCategorySelect(categories) {
    const categorySelect = this.elements.categorySelect;
    
    // Clear existing options except "General (All)"
    categorySelect.innerHTML = '';
    
    // Add dynamic categories
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = this.formatCategoryName(category);
      categorySelect.appendChild(option);
    });
    
    // Add "General (All)" option at the end
    const generalOption = document.createElement('option');
    generalOption.value = 'general';
    generalOption.textContent = 'General (All)';
    categorySelect.appendChild(generalOption);
  }
  
  formatCategoryName(category) {
    // Convert category names to proper case
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }
  
  attachEventListeners() {
    // Send button
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    
    // Enter key to send (Shift+Enter for new line)
    this.elements.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // New session button
    this.elements.newSessionBtn.addEventListener('click', () => this.startNewSession());
    
    // Auto-resize textarea
    this.elements.userInput.addEventListener('input', () => {
      this.elements.userInput.style.height = 'auto';
      this.elements.userInput.style.height = this.elements.userInput.scrollHeight + 'px';
    });
  }
  
  startNewSession() {
    this.sessionId = this.generateSessionId();
    this.messageHistory = [];
    this.elements.messagesDiv.innerHTML = '';
    this.elements.citationsDiv.innerHTML = '';
    this.elements.citationsDiv.classList.add('hidden');
    this.elements.sessionIdSpan.textContent = this.sessionId.substring(0, 8) + '...';
    
    this.addSystemMessage(this.getWelcomeMessage());
    this.updateStatus('ready', 'Ready');
  }
  
  getWelcomeMessage() {
    const language = this.elements.languageSelect.value;
    const messages = {
      en: 'Welcome! How can I help you today?',
      de: 'Willkommen! Wie kann ich Ihnen heute helfen?',
      fr: 'Bienvenue! Comment puis-je vous aider aujourd\'hui?',
      it: 'Benvenuto! Come posso aiutarti oggi?'
    };
    return messages[language] || messages.en;
  }
  
  async sendMessage() {
    const query = this.elements.userInput.value.trim();
    if (!query || this.isLoading) return;
    
    // Clear input and disable controls
    this.elements.userInput.value = '';
    this.elements.userInput.style.height = 'auto';
    this.setLoading(true);
    
    // Add user message to chat
    this.addUserMessage(query);
    
    // Parse model selection
    const [provider, model] = this.elements.modelSelect.value.split('|');
    
    // Prepare request
    const requestBody = {
      query,
      language: this.elements.languageSelect.value,
      category: this.elements.categorySelect.value,
      product: this.elements.productSelect.value,
      provider,
      model,
      sessionId: this.sessionId,
    };
    
    try {
      this.updateStatus('loading', 'Processing...');
      
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const error = await response.json();
        // Handle future model errors specially
        if (error.error === 'Model not available') {
          this.addSystemMessage(error.message);
          if (error.availableModels) {
            this.addSystemMessage('Available models: ' + error.availableModels.join(', '));
          }
          this.updateStatus('ready', 'Ready');
          return;
        }
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Display response
      this.addAssistantMessage(data.text);
      
      // Display citations if available
      if (data.citations && data.citations.length > 0) {
        this.displayCitations(data.citations);
      }
      
      // Update session ID if returned
      if (data.sessionId) {
        this.sessionId = data.sessionId;
      }
      
      // Show metadata if available
      if (data.metadata) {
        console.log('Response metadata:', data.metadata);
      }
      
      this.updateStatus('ready', 'Ready');
      
    } catch (error) {
      console.error('Error:', error);
      this.addErrorMessage(`Error: ${error.message}`);
      this.updateStatus('error', 'Error');
    } finally {
      this.setLoading(false);
    }
  }
  
  addUserMessage(text) {
    this.addMessage('user', text);
    this.messageHistory.push({ role: 'user', content: text });
  }
  
  addAssistantMessage(text) {
    this.addMessage('assistant', text);
    this.messageHistory.push({ role: 'assistant', content: text });
  }
  
  addSystemMessage(text) {
    this.addMessage('system', text);
  }
  
  addErrorMessage(text) {
    this.addMessage('error', text);
  }
  
  addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    // Format text (support basic markdown) with DOMPurify sanitization
    const formattedText = this.formatText(text);
    messageDiv.innerHTML = DOMPurify.sanitize(formattedText);
    
    this.elements.messagesDiv.appendChild(messageDiv);
    this.scrollToBottom();
  }
  
  formatText(text) {
    // Basic markdown support - but don't make links clickable for document references
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      // Show link text but don't make it clickable for local paths
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        // If it looks like a file path, just show the text
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `<span class="citation-ref">${text}</span>`;
        }
        // Otherwise make it a real link
        return `<a href="${url}" target="_blank">${text}</a>`;
      });
  }
  
  displayCitations(citations) {
    if (!citations || citations.length === 0) {
      this.elements.citationsDiv.classList.add('hidden');
      return;
    }
    
    const citationsHtml = `
      <div class="citations-header">Sources (${citations.length}):</div>
      ${citations.map(c => `
        <div class="citation">
          <span class="citation-icon">📄</span>
          <div class="citation-content">
            <div class="citation-filename">${this.escapeHtml(c.filename)}</div>
            <div class="citation-relevance">Relevance: ${(c.relevance * 100).toFixed(1)}%</div>
            ${c.snippet ? `<div class="citation-snippet">${this.escapeHtml(c.snippet)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    `;
    
    // Sanitize HTML before inserting
    this.elements.citationsDiv.innerHTML = DOMPurify.sanitize(citationsHtml);
    this.elements.citationsDiv.classList.remove('hidden');
  }
  
  setLoading(loading) {
    this.isLoading = loading;
    this.elements.sendBtn.disabled = loading;
    
    if (loading) {
      this.elements.sendBtn.querySelector('.btn-text').classList.add('hidden');
      this.elements.sendBtn.querySelector('.btn-loading').classList.remove('hidden');
    } else {
      this.elements.sendBtn.querySelector('.btn-text').classList.remove('hidden');
      this.elements.sendBtn.querySelector('.btn-loading').classList.add('hidden');
    }
  }
  
  updateStatus(status, text) {
    this.elements.statusText.textContent = text;
    this.elements.statusIndicator.className = 'status-indicator';
    
    if (status === 'error') {
      this.elements.statusIndicator.classList.add('error');
    } else if (status === 'loading') {
      this.elements.statusIndicator.classList.add('loading');
    }
  }
  
  scrollToBottom() {
    this.elements.messagesDiv.scrollTop = this.elements.messagesDiv.scrollHeight;
  }
  
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new ChatbotClient();
  
  // Check worker health
  fetch(window.chatbot.workerUrl + '/health')
    .then(response => response.json())
    .then(data => {
      console.log('Worker health check:', data);
    })
    .catch(error => {
      console.error('Worker health check failed:', error);
      window.chatbot.updateStatus('error', 'Worker offline');
    });
});