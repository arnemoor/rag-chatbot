/**
 * AutoRAG Chat Widget - Embeddable Web Component
 * Provides a customizable chat interface for AutoRAG-powered support
 */

// Import DOMPurify for XSS protection
import DOMPurify from 'dompurify';

// Import configuration service
import { getConfigService } from './config-service.js';

// Import modular components and services
import { WidgetStyles } from './styles/widget-styles.js';
import { ThemeManager } from './utils/theme-manager.js';
import { LanguageDetector } from './utils/language-detector.js';
import { StateManager } from './services/state-manager.js';
import { ApiService } from './services/api-service.js';
import { ChatMessage } from './components/chat-message.js';
import { ChatInput } from './components/chat-input.js';

class AutoRAGWidget extends HTMLElement {
  constructor() {
    super();

    // Create Shadow DOM for complete isolation
    this.attachShadow({ mode: 'open' });

    // Default configuration (will be overridden by dynamic config)
    this.config = {
      apiUrl: '', // Will be loaded dynamically
      language: 'en',
      category: '', // No default - must be selected from R2
      product: '', // No default - must be selected from R2
      provider: 'workers-ai',
      model: '@cf/meta/llama-3.2-3b-instruct',
      position: 'bottom-right',
      theme: 'light',
      minimized: true,
      buttonText: 'Chat with Support',
      enableSourceLinks: true, // Enable clickable source links by default
      headerTitle: 'Support Assistant',
      width: '400px',
      height: '600px',
      zIndex: 9999,
    };

    // Initialize services and managers
    this.configService = null;
    this.dynamicConfig = null;
    this.styleManager = null;
    this.themeManager = null;
    this.languageDetector = null;
    this.stateManager = null;
    this.apiService = null;
    this.messageComponent = null;
    this.inputComponent = null;

    // Store references for cleanup
    this.eventListeners = [];
    this.timeouts = new Set();
    this.clickHandler = null;
    this.keypressHandler = null;
  }

  static get observedAttributes() {
    return [
      'language',
      'category',
      'product',
      'provider',
      'model',
      'theme',
      'position',
      'api-url',
      'button-text',
      'header-title',
    ];
  }

  async connectedCallback() {
    await this.initializeWidget();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      const camelCase = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      this.config[camelCase] = newValue;

      // Re-render if already initialized
      if (this.shadowRoot.children.length > 0 && this.styleManager) {
        this.render();
      }
    }
  }

  /**
   * Initialize the widget
   */
  async initializeWidget() {
    // Load configuration
    await this.loadConfiguration();
    
    // Initialize services and managers
    this.initializeServices();
    
    // Load saved state
    this.stateManager.initialize(this.config);
    
    // Apply loaded state
    const state = this.stateManager.getState();
    if (state.isMinimized !== undefined) {
      this.config.minimized = state.isMinimized;
    }
    
    // Render the widget
    this.render();
  }

  /**
   * Initialize all services and managers
   */
  initializeServices() {
    // Initialize style manager
    this.styleManager = new WidgetStyles(this.config);
    
    // Initialize theme manager
    this.themeManager = new ThemeManager();
    this.config.theme = this.themeManager.initialize(this.config.theme);
    
    // Initialize language detector
    this.languageDetector = new LanguageDetector();
    this.config.language = this.languageDetector.initialize(this.config.language);
    
    // Initialize state manager
    this.stateManager = new StateManager();
    
    // Initialize API service
    this.apiService = new ApiService(this.config.apiUrl);

    // Initialize message component
    this.messageComponent = new ChatMessage();
    
    // Initialize input component (will be created when expanded)
    this.inputComponent = null;
    
    // Set up theme observer
    this.themeManager.addObserver((theme) => {
      this.config.theme = theme;
      this.render();
    });
    
    // Set up state observers
    this.stateManager.addObserver('isMinimized', (isMinimized) => {
      if (isMinimized !== (this.config.minimized === true)) {
        this.config.minimized = isMinimized;
        this.render();
      }
    });

    this.stateManager.addObserver('isMaximized', (isMaximized) => {
      // Re-render to apply maximized class
      this.render();
    });
  }

  /**
   * Load configuration from various sources
   */
  async loadConfiguration() {
    // Step 1: Determine API URL
    let apiUrl = this.getAttribute('api-url');

    if (!apiUrl) {
      // Try to load deployment config for API URL
      try {
        const configResponse = await fetch('/deployment-config.json');
        if (configResponse.ok) {
          const deploymentConfig = await configResponse.json();
          if (deploymentConfig.worker_url) {
            apiUrl = deploymentConfig.worker_url;
          }
        }
      } catch (e) {
        // Could not load deployment config - this is expected in many deployments
      }
    }

    // Use fallback if still no URL
    if (!apiUrl) {
      console.warn(
        'AutoRAG: No API URL configured. Please set api-url attribute or provide deployment-config.json',
      );
      // Use current origin as last resort (for same-origin deployments)
      apiUrl = window.location.origin;
    }

    this.config.apiUrl = apiUrl;

    // Step 2: Initialize configuration service
    this.configService = getConfigService(apiUrl);

    // Step 3: Load dynamic configuration
    try {
      this.dynamicConfig = await this.configService.getConfiguration();

      // Apply default settings from dynamic config
      if (this.dynamicConfig.defaultSettings) {
        Object.assign(this.config, this.dynamicConfig.defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load dynamic configuration:', error);
      // Continue with defaults
    }

    // Step 4: Load from attributes (override dynamic defaults)
    const attributes = this.getAttributeNames();
    attributes.forEach((attr) => {
      const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      if (Object.prototype.hasOwnProperty.call(this.config, camelCase)) {
        let value = this.getAttribute(attr);

        // Convert boolean string values
        if (value === 'true') value = true;
        if (value === 'false') value = false;

        this.config[camelCase] = value;
      }
    });

    // Step 5: Load from global config if available (highest priority)
    if (window.AutoRAGConfig) {
      Object.assign(this.config, window.AutoRAGConfig);
    }
  }

  /**
   * Render the widget
   */
  render() {
    // Remove existing event listeners before re-rendering
    this.removeEventListeners();

    // Update styles if style manager exists
    if (this.styleManager) {
      this.styleManager.config = this.config;
    }

    const styles = this.styleManager ? this.styleManager.getStyles() : '';
    const isMinimized = this.stateManager ? this.stateManager.get('isMinimized') : this.config.minimized;
    const html = isMinimized ? this.getMinimizedHTML() : this.getExpandedHTML();

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="autorag-widget-container ${this.config.position}" data-minimized="${isMinimized}">
        ${html}
      </div>
    `;

    // Restore messages if expanded
    if (!isMinimized && this.stateManager) {
      const messages = this.stateManager.getMessages();
      if (messages.length > 0) {
        const messagesContainer = this.shadowRoot.getElementById('messages');
        if (messagesContainer && this.messageComponent) {
          this.messageComponent.renderBatch(messagesContainer, messages);
        }
      } else {
        // Show welcome message
        this.showWelcomeMessage();
      }
    }

    // Re-attach event listeners after rendering
    requestAnimationFrame(() => {
      this.attachEventListeners();
    });
  }

  /**
   * Get minimized state HTML
   */
  getMinimizedHTML() {
    const translations = this.languageDetector ? this.languageDetector.getTranslations() : {};
    const buttonText = this.config.buttonText || translations.buttonText || 'Chat with Support';

    return `
      <button class="widget-button" aria-label="${translations.openButton || 'Open chat'}" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span style="pointer-events: none;">${buttonText}</span>
      </button>
    `;
  }

  /**
   * Get expanded state HTML
   */
  getExpandedHTML() {
    const translations = this.languageDetector ? this.languageDetector.getTranslations() : {};
    const headerTitle = this.config.headerTitle || translations.headerTitle || 'Support Assistant';
    const isMaximized = this.stateManager ? this.stateManager.get('isMaximized') : false;
    const maximizeIcon = isMaximized
      ? '⊡' // Restore icon
      : '□'; // Maximize icon

    return `
      <div class="widget-chat ${isMaximized ? 'maximized' : ''}">
        <div class="widget-header">
          <h3>${headerTitle}</h3>
          <div class="widget-header-actions">
            <button class="widget-maximize" aria-label="${isMaximized ? 'Restore' : 'Maximize'}" title="${isMaximized ? 'Restore' : 'Maximize'}">${maximizeIcon}</button>
            <button class="widget-close" aria-label="${translations.closeButton || 'Close chat'}">×</button>
          </div>
        </div>
        <div class="widget-messages" id="messages"></div>
        <div class="widget-input-container" id="input-container"></div>
      </div>
    `;
  }

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    const messagesContainer = this.shadowRoot.getElementById('messages');
    if (messagesContainer && this.messageComponent) {
      const welcomeMessage = this.messageComponent.createWelcomeMessage(this.config.language);
      messagesContainer.appendChild(welcomeMessage);
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Remove any existing listeners first
    this.removeEventListeners();

    // Create new event handlers
    this.clickHandler = (e) => {
      const widgetButton = e.target.closest('.widget-button');
      const widgetClose = e.target.closest('.widget-close');
      const widgetMaximize = e.target.closest('.widget-maximize');

      if (widgetButton) {
        e.preventDefault();
        e.stopPropagation();
        this.expand();
      } else if (widgetMaximize) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMaximize();
      } else if (widgetClose) {
        e.preventDefault();
        e.stopPropagation();
        this.minimize();
      }
    };

    // Attach new listeners
    this.shadowRoot.addEventListener('click', this.clickHandler);

    // Set up input component if expanded
    if (!this.stateManager.get('isMinimized')) {
      this.setupInputComponent();
    }
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (this.clickHandler && this.shadowRoot) {
      this.shadowRoot.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }

    if (this.keypressHandler && this.shadowRoot) {
      this.shadowRoot.removeEventListener('keypress', this.keypressHandler);
      this.keypressHandler = null;
    }
  }

  /**
   * Set up input component
   */
  setupInputComponent() {
    const inputContainer = this.shadowRoot.getElementById('input-container');
    if (!inputContainer) return;

    const translations = this.languageDetector ? this.languageDetector.getTranslations() : {};
    
    // Create input component
    this.inputComponent = new ChatInput({
      placeholder: translations.inputPlaceholder || 'Type your message...',
      sendButtonText: translations.sendButton || 'Send',
      onSend: (message) => this.sendMessage(message),
    });

    const inputElement = this.inputComponent.create();
    inputContainer.appendChild(inputElement);

    // Focus input after a short delay
    const focusTimeout = setTimeout(() => {
      this.inputComponent.focus();
      this.timeouts.delete(focusTimeout);
    }, 100);
    this.timeouts.add(focusTimeout);
  }

  /**
   * Expand the widget
   */
  expand() {
    if (this.stateManager) {
      this.stateManager.set('isMinimized', false);
    }

    this.dispatchEvent(
      new CustomEvent('widget-opened', {
        detail: { sessionId: this.stateManager.get('sessionId') },
      }),
    );
  }

  /**
   * Minimize the widget
   */
  minimize() {
    if (this.stateManager) {
      this.stateManager.set('isMinimized', true);
    }

    this.dispatchEvent(
      new CustomEvent('widget-closed', {
        detail: { sessionId: this.stateManager.get('sessionId') },
      }),
    );
  }

  /**
   * Toggle maximize/restore state
   */
  toggleMaximize() {
    if (this.stateManager) {
      const isMaximized = this.stateManager.get('isMaximized');
      this.stateManager.set('isMaximized', !isMaximized);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(message) {
    if (!message || !this.inputComponent || !this.apiService) return;

    // Add user message
    this.addMessage('user', message);

    // Disable input while processing
    this.inputComponent.disable();

    // Add loading indicator
    const messagesContainer = this.shadowRoot.getElementById('messages');
    const loadingId = this.messageComponent.addTypingIndicator(messagesContainer);

    try {
      // Prepare request
      const [provider, model] = this.config.model.includes('|')
        ? this.config.model.split('|')
        : [this.config.provider, this.config.model];

      // Send message via API service
      const response = await this.apiService.sendMessage({
        query: message,
        language: this.config.language,
        category: this.config.category,
        product: this.config.product,
        provider,
        model,
        sessionId: this.stateManager.get('sessionId'),
      });

      // Remove loading message
      this.messageComponent.removeTypingIndicator(loadingId, messagesContainer);

      // Format response with citations if enabled
      let responseText = response.text;
      if (this.config.enableSourceLinks && response.citations && response.citations.length > 0) {
        // Strip LLM-generated source citations (e.g., "Source: file1.pdf, file2.pdf")
        // This prevents duplicate citations
        responseText = responseText.replace(/\n*Source[s]?:\s*[^\n]+(\n|$)/gi, '\n').trim();

        // Add structured citations with download links
        responseText += '\n\n**Sources:**\n';
        response.citations.forEach((citation, index) => {
          const fullPath = citation.filename;
          // Extract just the filename (last part after /)
          const displayName = fullPath.split('/').pop();
          const encodedPath = encodeURIComponent(fullPath);
          const downloadUrl = `${this.config.apiUrl}/r2/get/${encodedPath}`;
          responseText += `${index + 1}. [${displayName}](${downloadUrl})\n`;
        });
      }

      // Add assistant response
      this.addMessage('assistant', responseText);

      // Update session ID if provided
      if (response.sessionId) {
        this.stateManager.set('sessionId', response.sessionId);
      }

      // Dispatch message event
      this.dispatchEvent(
        new CustomEvent('message-sent', {
          detail: {
            message,
            response: response.text,
            sessionId: this.stateManager.get('sessionId'),
          },
        }),
      );
    } catch (error) {
      console.error('AutoRAG Widget Error:', error);

      // Remove loading message
      this.messageComponent.removeTypingIndicator(loadingId, messagesContainer);

      // Add error message
      const errorMessage = this.messageComponent.createErrorMessage(
        error.message,
        this.config.language
      );
      messagesContainer.appendChild(errorMessage);

      this.dispatchEvent(
        new CustomEvent('widget-error', {
          detail: { error: error.message },
        }),
      );
    } finally {
      // Re-enable input
      if (this.inputComponent) {
        this.inputComponent.enable();
        this.inputComponent.focus();
      }
    }
  }

  /**
   * Add a message to the chat
   */
  addMessage(type, text) {
    if (!this.stateManager || !this.messageComponent) return;

    const messageData = { type, text };
    
    // Add to state
    const messageId = this.stateManager.addMessage(messageData);
    
    // Add to DOM
    const messagesContainer = this.shadowRoot.getElementById('messages');
    if (messagesContainer) {
      this.messageComponent.render(messagesContainer, {
        ...messageData,
        id: messageId,
      });
    }

    return messageId;
  }

  /**
   * Announce message for screen readers
   */
  announceMessage(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    this.shadowRoot.appendChild(announcement);

    const removeTimeout = setTimeout(() => {
      if (announcement && announcement.parentNode) {
        announcement.remove();
      }
      this.timeouts.delete(removeTimeout);
    }, 1000);
    this.timeouts.add(removeTimeout);
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Clear all timeouts
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timeouts.clear();

    // Remove event listeners
    this.removeEventListeners();

    // Clean up services
    if (this.themeManager) {
      this.themeManager.destroy();
    }

    if (this.stateManager) {
      this.stateManager.destroy();
    }

    if (this.inputComponent) {
      this.inputComponent.destroy();
    }

    // Clear references
    this.configService = null;
    this.styleManager = null;
    this.themeManager = null;
    this.languageDetector = null;
    this.stateManager = null;
    this.apiService = null;
    this.messageComponent = null;
    this.inputComponent = null;
  }
}

// Register the web component
if (!customElements.get('autorag-widget')) {
  customElements.define('autorag-widget', AutoRAGWidget);
}

// Auto-initialize if global config exists
if (
  typeof window !== 'undefined' &&
  window.AutoRAGConfig &&
  window.AutoRAGConfig.autoInit !== false
) {
  const autoInitHandler = () => {
    if (!document.querySelector('autorag-widget')) {
      const widget = document.createElement('autorag-widget');
      document.body.appendChild(widget);
    }
    // Remove the listener after it's been used
    document.removeEventListener('DOMContentLoaded', autoInitHandler);
  };

  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitHandler);
  } else {
    // DOM is already loaded, execute immediately
    autoInitHandler();
  }
}

// Export for module usage
export default AutoRAGWidget;