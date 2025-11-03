/**
 * Chat Message Component
 * Handles individual message rendering and formatting
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify for strict XSS prevention
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
    'ul', 'ol', 'li', 'a', 'blockquote', 'h3', 'h4'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^https?:\/\//i,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  FORCE_BODY: true,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  IN_PLACE: false
};

// Add hooks to enforce security
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Set secure attributes for links
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    
    // Ensure only HTTPS links (except for localhost)
    const href = node.getAttribute('href');
    if (href && !href.startsWith('https://') && !href.includes('localhost')) {
      node.removeAttribute('href');
    }
  }
});

export class ChatMessage {
  constructor() {
    this.messageIdCounter = 0;
  }

  /**
   * Create a message element
   * @param {Object} options - Message options
   * @returns {HTMLElement} Message element
   */
  createElement(options) {
    const {
      type = 'assistant',
      text = '',
      id = this.generateMessageId(),
      timestamp = new Date().toISOString(),
      status = 'sent',
    } = options;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.id = `msg-${id}`;
    messageEl.setAttribute('data-timestamp', timestamp);
    messageEl.setAttribute('data-status', status);

    if (type === 'loading') {
      messageEl.innerHTML = this.getLoadingHTML();
    } else {
      const formattedText = this.formatMessage(text);
      messageEl.innerHTML = DOMPurify.sanitize(formattedText, PURIFY_CONFIG);
    }

    return messageEl;
  }

  /**
   * Create a loading message
   * @returns {Object} Loading message info
   */
  createLoadingMessage() {
    const id = this.generateMessageId();
    const element = document.createElement('div');
    element.className = 'message message-loading';
    element.id = `msg-${id}`;
    element.innerHTML = this.getLoadingHTML();
    
    return { id, element };
  }

  /**
   * Get loading message HTML
   * @returns {string} Loading HTML
   */
  getLoadingHTML() {
    return `
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  }

  /**
   * Format message text (basic markdown support)
   * @param {string} text - Raw message text
   * @returns {string} Formatted HTML
   */
  formatMessage(text) {
    if (!text) return '';

    // Escape HTML first
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply markdown-like formatting
    formatted = formatted
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Links (only external ones)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      );

    // Handle lists
    formatted = this.formatLists(formatted);

    return formatted;
  }

  /**
   * Format lists in message
   * @param {string} text - Text with potential lists
   * @returns {string} Text with formatted lists
   */
  formatLists(text) {
    // Handle unordered lists
    const unorderedListRegex = /(?:^|\n)((?:[\*\-\+] .+(?:\n|$))+)/gm;
    text = text.replace(unorderedListRegex, (match, listContent) => {
      const items = listContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<li>${line.replace(/^[\*\-\+]\s+/, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    // Handle ordered lists
    const orderedListRegex = /(?:^|\n)((?:\d+\. .+(?:\n|$))+)/gm;
    text = text.replace(orderedListRegex, (match, listContent) => {
      const items = listContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

    return text;
  }

  /**
   * Update message content
   * @param {string|HTMLElement} messageOrId - Message element or ID
   * @param {string} newText - New message text
   */
  updateMessage(messageOrId, newText) {
    const element = typeof messageOrId === 'string' 
      ? document.getElementById(`msg-${messageOrId}`)
      : messageOrId;

    if (element) {
      const formattedText = this.formatMessage(newText);
      element.innerHTML = DOMPurify.sanitize(formattedText, PURIFY_CONFIG);
      element.setAttribute('data-status', 'updated');
    }
  }

  /**
   * Remove message by ID
   * @param {string} messageId - Message ID to remove
   * @param {HTMLElement} container - Optional container to search within (for Shadow DOM)
   */
  removeMessage(messageId, container) {
    let element;
    if (container) {
      // Search within container (for Shadow DOM)
      element = container.querySelector(`#msg-${messageId}`);
    } else {
      // Fallback to document search
      element = document.getElementById(`msg-${messageId}`);
    }

    if (element) {
      element.remove();
    }
  }

  /**
   * Add typing indicator
   * @param {HTMLElement} container - Container element
   * @returns {string} Indicator ID
   */
  addTypingIndicator(container) {
    const indicator = this.createLoadingMessage();
    container.appendChild(indicator.element);
    this.scrollToBottom(container);
    return indicator.id;
  }

  /**
   * Remove typing indicator
   * @param {string} indicatorId - Indicator ID
   * @param {HTMLElement} container - Container to search within
   */
  removeTypingIndicator(indicatorId, container) {
    this.removeMessage(indicatorId, container);
  }

  /**
   * Scroll to bottom of container
   * @param {HTMLElement} container - Container to scroll
   */
  scrollToBottom(container) {
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Generate unique message ID
   * @returns {string} Message ID
   */
  generateMessageId() {
    return `${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Create welcome message
   * @param {string} language - Language code
   * @returns {HTMLElement} Welcome message element
   */
  createWelcomeMessage(language = 'en') {
    const welcomeTexts = {
      en: 'Hello! How can I help you today?',
      de: 'Hallo! Wie kann ich Ihnen heute helfen?',
      fr: "Bonjour! Comment puis-je vous aider aujourd'hui?",
      it: 'Ciao! Come posso aiutarti oggi?',
    };

    return this.createElement({
      type: 'assistant',
      text: welcomeTexts[language] || welcomeTexts.en,
      id: 'welcome',
    });
  }

  /**
   * Create error message
   * @param {string} errorText - Error text
   * @param {string} language - Language code
   * @returns {HTMLElement} Error message element
   */
  createErrorMessage(errorText, language = 'en') {
    const errorTexts = {
      en: errorText || 'Sorry, something went wrong. Please try again.',
      de: errorText || 'Entschuldigung, etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
      fr: errorText || "Désolé, quelque chose s'est mal passé. Veuillez réessayer.",
      it: errorText || 'Spiacente, qualcosa è andato storto. Per favore riprova.',
    };

    const element = this.createElement({
      type: 'error',
      text: errorTexts[language] || errorTexts.en,
    });

    return element;
  }

  /**
   * Render message to container
   * @param {HTMLElement} container - Container element
   * @param {Object} messageData - Message data
   * @returns {HTMLElement} Rendered message element
   */
  render(container, messageData) {
    const element = this.createElement(messageData);
    container.appendChild(element);
    this.scrollToBottom(container);
    return element;
  }

  /**
   * Batch render messages
   * @param {HTMLElement} container - Container element
   * @param {Array} messages - Array of message data
   */
  renderBatch(container, messages) {
    const fragment = document.createDocumentFragment();
    
    messages.forEach(messageData => {
      const element = this.createElement(messageData);
      fragment.appendChild(element);
    });
    
    container.appendChild(fragment);
    this.scrollToBottom(container);
  }

  /**
   * Clear all messages from container
   * @param {HTMLElement} container - Container to clear
   */
  clearMessages(container) {
    if (container) {
      container.innerHTML = '';
    }
  }
}