/**
 * State Manager Service
 * Manages widget state and persistence
 */

export class StateManager {
  constructor() {
    this.state = {
      messages: [],
      sessionId: this.generateSessionId(),
      isMinimized: true,
      config: {},
    };
    
    this.maxMessages = 50; // Limit for message history
    this.storageKey = 'autorag-widget-state';
    this.observers = new Map();
  }

  /**
   * Initialize state
   * @param {Object} config - Initial configuration
   */
  initialize(config = {}) {
    this.state.config = config;
    this.loadState();
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state value
   * @param {string} key - State key
   * @returns {*} State value
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set state value
   * @param {string} key - State key
   * @param {*} value - New value
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Notify observers
    this.notifyObservers(key, value, oldValue);
    
    // Auto-save state for certain keys
    if (['messages', 'sessionId', 'isMinimized'].includes(key)) {
      this.saveState();
    }
  }

  /**
   * Update multiple state values
   * @param {Object} updates - Object with updates
   */
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Add a message to the state
   * @param {Object} message - Message object
   * @returns {string} Message ID
   */
  addMessage(message) {
    const messageWithId = {
      ...message,
      id: message.id || Date.now().toString(),
      timestamp: message.timestamp || new Date().toISOString(),
    };
    
    const messages = [...this.state.messages, messageWithId];
    
    // Limit message history
    if (messages.length > this.maxMessages) {
      messages.splice(0, messages.length - this.maxMessages);
    }
    
    this.set('messages', messages);
    return messageWithId.id;
  }

  /**
   * Remove a message by ID
   * @param {string} messageId - Message ID to remove
   */
  removeMessage(messageId) {
    const messages = this.state.messages.filter(msg => msg.id !== messageId);
    this.set('messages', messages);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.set('messages', []);
  }

  /**
   * Get messages
   * @param {number} limit - Optional limit
   * @returns {Array} Messages array
   */
  getMessages(limit = null) {
    const messages = [...this.state.messages];
    if (limit && limit < messages.length) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Toggle minimized state
   * @returns {boolean} New minimized state
   */
  toggleMinimized() {
    const newState = !this.state.isMinimized;
    this.set('isMinimized', newState);
    return newState;
  }

  /**
   * Generate a new session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Reset session
   */
  resetSession() {
    this.set('sessionId', this.generateSessionId());
    this.clearMessages();
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const stateToSave = {
        messages: this.state.messages.slice(-this.maxMessages),
        sessionId: this.state.sessionId,
        isMinimized: this.state.isMinimized,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save widget state:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Check if saved state is not too old (24 hours)
        const savedTime = new Date(parsed.timestamp || 0);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          this.state.messages = parsed.messages || [];
          this.state.sessionId = parsed.sessionId || this.state.sessionId;
          this.state.isMinimized = parsed.isMinimized !== undefined ? parsed.isMinimized : true;
        } else {
          // Clear old state
          this.clearState();
        }
      }
    } catch (e) {
      console.warn('Could not load widget state:', e);
    }
  }

  /**
   * Clear saved state
   */
  clearState() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Could not clear widget state:', e);
    }
    
    // Reset to defaults
    this.state.messages = [];
    this.state.sessionId = this.generateSessionId();
    this.state.isMinimized = true;
  }

  /**
   * Add observer for state changes
   * @param {string} key - State key to observe (or '*' for all)
   * @param {Function} callback - Callback function
   */
  addObserver(key, callback) {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set());
    }
    this.observers.get(key).add(callback);
  }

  /**
   * Remove observer
   * @param {string} key - State key
   * @param {Function} callback - Callback to remove
   */
  removeObserver(key, callback) {
    if (this.observers.has(key)) {
      this.observers.get(key).delete(callback);
    }
  }

  /**
   * Notify observers of state change
   * @param {string} key - Changed key
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifyObservers(key, newValue, oldValue) {
    // Notify specific key observers
    if (this.observers.has(key)) {
      this.observers.get(key).forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (e) {
          console.error('Error notifying state observer:', e);
        }
      });
    }
    
    // Notify wildcard observers
    if (this.observers.has('*')) {
      this.observers.get('*').forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (e) {
          console.error('Error notifying state observer:', e);
        }
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.saveState();
    this.observers.clear();
  }
}