/**
 * Chat Input Component
 * Handles the input field and send button functionality
 */

export class ChatInput {
  constructor(options = {}) {
    this.onSend = options.onSend || (() => {});
    this.placeholder = options.placeholder || 'Type your message...';
    this.sendButtonText = options.sendButtonText || 'Send';
    this.maxLength = options.maxLength || 1000;
    this.allowEnterToSend = options.allowEnterToSend !== false;
    
    this.inputElement = null;
    this.sendButton = null;
    this.container = null;
  }

  /**
   * Create the input component
   * @returns {HTMLElement} Input container element
   */
  create() {
    this.container = document.createElement('div');
    this.container.className = 'widget-input-area';
    this.container.innerHTML = this.getHTML();
    
    // Get references to elements
    this.inputElement = this.container.querySelector('.widget-input');
    this.sendButton = this.container.querySelector('.widget-send-btn');
    
    // Attach event listeners
    this.attachEventListeners();
    
    return this.container;
  }

  /**
   * Get component HTML
   * @returns {string} Component HTML
   */
  getHTML() {
    return `
      <textarea 
        class="widget-input" 
        id="widget-input"
        placeholder="${this.placeholder}"
        rows="2"
        maxlength="${this.maxLength}"
        aria-label="Chat message"
      ></textarea>
      <button class="widget-send-btn" id="widget-send" type="button">
        ${this.sendButtonText}
      </button>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Send button click
    this.sendButton.addEventListener('click', () => this.handleSend());
    
    // Enter key handling
    if (this.allowEnterToSend) {
      this.inputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });
    }
    
    // Auto-resize textarea
    this.inputElement.addEventListener('input', () => this.autoResize());
    
    // Character counter (optional)
    this.inputElement.addEventListener('input', () => this.updateCharacterCount());
  }

  /**
   * Handle send action
   */
  handleSend() {
    const message = this.getValue();
    if (message && !this.isDisabled()) {
      this.onSend(message);
      this.clear();
      this.resetSize();
    }
  }

  /**
   * Get input value
   * @returns {string} Trimmed input value
   */
  getValue() {
    return this.inputElement ? this.inputElement.value.trim() : '';
  }

  /**
   * Set input value
   * @param {string} value - Value to set
   */
  setValue(value) {
    if (this.inputElement) {
      this.inputElement.value = value;
      this.autoResize();
    }
  }

  /**
   * Clear input
   */
  clear() {
    this.setValue('');
  }

  /**
   * Focus input
   */
  focus() {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Blur input
   */
  blur() {
    if (this.inputElement) {
      this.inputElement.blur();
    }
  }

  /**
   * Enable input and button
   */
  enable() {
    if (this.inputElement) {
      this.inputElement.disabled = false;
      this.inputElement.classList.remove('disabled');
    }
    if (this.sendButton) {
      this.sendButton.disabled = false;
      this.sendButton.classList.remove('disabled');
    }
  }

  /**
   * Disable input and button
   */
  disable() {
    if (this.inputElement) {
      this.inputElement.disabled = true;
      this.inputElement.classList.add('disabled');
    }
    if (this.sendButton) {
      this.sendButton.disabled = true;
      this.sendButton.classList.add('disabled');
    }
  }

  /**
   * Check if input is disabled
   * @returns {boolean}
   */
  isDisabled() {
    return this.inputElement ? this.inputElement.disabled : true;
  }

  /**
   * Set placeholder text
   * @param {string} placeholder - Placeholder text
   */
  setPlaceholder(placeholder) {
    this.placeholder = placeholder;
    if (this.inputElement) {
      this.inputElement.placeholder = placeholder;
    }
  }

  /**
   * Set send button text
   * @param {string} text - Button text
   */
  setSendButtonText(text) {
    this.sendButtonText = text;
    if (this.sendButton) {
      this.sendButton.textContent = text;
    }
  }

  /**
   * Auto-resize textarea based on content
   */
  autoResize() {
    if (!this.inputElement) return;
    
    // Reset height to auto to get the correct scrollHeight
    this.inputElement.style.height = 'auto';
    
    // Calculate new height
    const maxHeight = 120; // Maximum height in pixels
    const newHeight = Math.min(this.inputElement.scrollHeight, maxHeight);
    
    // Set new height
    this.inputElement.style.height = `${newHeight}px`;
    
    // Add scroll if content exceeds max height
    this.inputElement.style.overflowY = this.inputElement.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  /**
   * Reset textarea size
   */
  resetSize() {
    if (this.inputElement) {
      this.inputElement.style.height = 'auto';
      this.inputElement.style.overflowY = 'hidden';
    }
  }

  /**
   * Update character count display (if implemented)
   */
  updateCharacterCount() {
    if (!this.inputElement) return;
    
    const current = this.inputElement.value.length;
    const remaining = this.maxLength - current;
    
    // Dispatch custom event for character count
    this.inputElement.dispatchEvent(new CustomEvent('charactercount', {
      detail: { current, remaining, max: this.maxLength }
    }));
    
    // Visual feedback when approaching limit
    if (remaining < 50) {
      this.inputElement.classList.add('near-limit');
    } else {
      this.inputElement.classList.remove('near-limit');
    }
  }

  /**
   * Set on send callback
   * @param {Function} callback - Callback function
   */
  setOnSend(callback) {
    this.onSend = callback;
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.disable();
    if (this.sendButton) {
      this.sendButton.innerHTML = '<span class="loading-spinner"></span>';
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.enable();
    if (this.sendButton) {
      this.sendButton.textContent = this.sendButtonText;
    }
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    // Remove event listeners if needed
    if (this.container) {
      this.container.remove();
    }
    
    this.inputElement = null;
    this.sendButton = null;
    this.container = null;
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.placeholder) {
      this.setPlaceholder(config.placeholder);
    }
    if (config.sendButtonText) {
      this.setSendButtonText(config.sendButtonText);
    }
    if (config.maxLength) {
      this.maxLength = config.maxLength;
      if (this.inputElement) {
        this.inputElement.maxLength = config.maxLength;
      }
    }
    if (config.allowEnterToSend !== undefined) {
      this.allowEnterToSend = config.allowEnterToSend;
    }
  }
}