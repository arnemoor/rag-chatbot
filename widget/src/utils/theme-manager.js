/**
 * Theme Manager Module
 * Handles theme switching and preferences
 */

export class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.observers = new Set();
  }

  /**
   * Initialize theme from config or system preference
   * @param {string} configTheme - Theme from config
   * @returns {string} Applied theme
   */
  initialize(configTheme) {
    if (configTheme) {
      this.currentTheme = configTheme;
    } else if (this.supportsSystemPreference()) {
      this.currentTheme = this.getSystemPreference();
      this.watchSystemPreference();
    }
    
    return this.currentTheme;
  }

  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Set theme
   * @param {string} theme - Theme to set ('light' or 'dark')
   */
  setTheme(theme) {
    if (theme !== this.currentTheme) {
      this.currentTheme = theme;
      this.notifyObservers();
      this.savePreference(theme);
    }
  }

  /**
   * Toggle between light and dark themes
   * @returns {string} New theme
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Check if system preference is supported
   * @returns {boolean}
   */
  supportsSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme)').media !== 'not all';
  }

  /**
   * Get system color scheme preference
   * @returns {string} 'dark' or 'light'
   */
  getSystemPreference() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Watch for system preference changes
   */
  watchSystemPreference() {
    if (!this.supportsSystemPreference()) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Use addEventListener for better compatibility
    const handler = (e) => {
      this.setTheme(e.matches ? 'dark' : 'light');
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }
  }

  /**
   * Save theme preference to localStorage
   * @param {string} theme - Theme to save
   */
  savePreference(theme) {
    try {
      localStorage.setItem('autorag-widget-theme', theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }

  /**
   * Load theme preference from localStorage
   * @returns {string|null} Saved theme or null
   */
  loadPreference() {
    try {
      return localStorage.getItem('autorag-widget-theme');
    } catch (e) {
      console.warn('Could not load theme preference:', e);
      return null;
    }
  }

  /**
   * Add observer for theme changes
   * @param {Function} callback - Callback to call on theme change
   */
  addObserver(callback) {
    this.observers.add(callback);
  }

  /**
   * Remove observer
   * @param {Function} callback - Callback to remove
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  /**
   * Notify all observers of theme change
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.currentTheme);
      } catch (e) {
        console.error('Error notifying theme observer:', e);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.observers.clear();
  }
}