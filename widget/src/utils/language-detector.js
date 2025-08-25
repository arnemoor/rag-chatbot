/**
 * Language Detector Module
 * Handles language detection and localization
 */

export class LanguageDetector {
  constructor() {
    this.supportedLanguages = ['en', 'de', 'fr', 'it'];
    this.defaultLanguage = 'en';
    this.currentLanguage = this.defaultLanguage;
    
    // Localized strings for the widget
    this.translations = {
      en: {
        buttonText: 'Chat with Support',
        headerTitle: 'Support Assistant',
        inputPlaceholder: 'Type your message...',
        sendButton: 'Send',
        welcomeMessage: 'Hello! How can I help you today?',
        errorMessage: 'Sorry, something went wrong. Please try again.',
        closeButton: 'Close chat',
        openButton: 'Open chat',
      },
      de: {
        buttonText: 'Mit Support chatten',
        headerTitle: 'Support-Assistent',
        inputPlaceholder: 'Nachricht eingeben...',
        sendButton: 'Senden',
        welcomeMessage: 'Hallo! Wie kann ich Ihnen heute helfen?',
        errorMessage: 'Entschuldigung, etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
        closeButton: 'Chat schließen',
        openButton: 'Chat öffnen',
      },
      fr: {
        buttonText: 'Discuter avec le support',
        headerTitle: 'Assistant de support',
        inputPlaceholder: 'Tapez votre message...',
        sendButton: 'Envoyer',
        welcomeMessage: "Bonjour! Comment puis-je vous aider aujourd'hui?",
        errorMessage: "Désolé, quelque chose s'est mal passé. Veuillez réessayer.",
        closeButton: 'Fermer le chat',
        openButton: 'Ouvrir le chat',
      },
      it: {
        buttonText: 'Chatta con il supporto',
        headerTitle: 'Assistente di supporto',
        inputPlaceholder: 'Scrivi il tuo messaggio...',
        sendButton: 'Invia',
        welcomeMessage: 'Ciao! Come posso aiutarti oggi?',
        errorMessage: 'Spiacente, qualcosa è andato storto. Per favore riprova.',
        closeButton: 'Chiudi chat',
        openButton: 'Apri chat',
      },
    };
  }

  /**
   * Initialize language from config or browser settings
   * @param {string} configLanguage - Language from config
   * @returns {string} Applied language
   */
  initialize(configLanguage) {
    if (configLanguage && this.isSupported(configLanguage)) {
      this.currentLanguage = configLanguage;
    } else {
      this.currentLanguage = this.detectBrowserLanguage();
    }
    
    return this.currentLanguage;
  }

  /**
   * Detect browser language
   * @returns {string} Detected language code
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    
    if (!browserLang) {
      return this.defaultLanguage;
    }
    
    // Extract language code (e.g., 'en' from 'en-US')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    if (this.isSupported(langCode)) {
      return langCode;
    }
    
    return this.defaultLanguage;
  }

  /**
   * Check if language is supported
   * @param {string} langCode - Language code to check
   * @returns {boolean}
   */
  isSupported(langCode) {
    return this.supportedLanguages.includes(langCode);
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Set language
   * @param {string} langCode - Language code to set
   * @returns {boolean} Success
   */
  setLanguage(langCode) {
    if (this.isSupported(langCode)) {
      this.currentLanguage = langCode;
      this.savePreference(langCode);
      return true;
    }
    return false;
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @param {string} langCode - Optional language code
   * @returns {string} Translated text
   */
  translate(key, langCode = null) {
    const lang = langCode || this.currentLanguage;
    const translations = this.translations[lang] || this.translations[this.defaultLanguage];
    return translations[key] || key;
  }

  /**
   * Get all translations for current language
   * @returns {Object} Translations object
   */
  getTranslations() {
    return this.translations[this.currentLanguage] || this.translations[this.defaultLanguage];
  }

  /**
   * Add or update translations for a language
   * @param {string} langCode - Language code
   * @param {Object} translations - Translations object
   */
  addTranslations(langCode, translations) {
    if (!this.translations[langCode]) {
      this.translations[langCode] = {};
      this.supportedLanguages.push(langCode);
    }
    Object.assign(this.translations[langCode], translations);
  }

  /**
   * Save language preference to localStorage
   * @param {string} langCode - Language code to save
   */
  savePreference(langCode) {
    try {
      localStorage.setItem('autorag-widget-language', langCode);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  }

  /**
   * Load language preference from localStorage
   * @returns {string|null} Saved language or null
   */
  loadPreference() {
    try {
      const saved = localStorage.getItem('autorag-widget-language');
      return saved && this.isSupported(saved) ? saved : null;
    } catch (e) {
      console.warn('Could not load language preference:', e);
      return null;
    }
  }

  /**
   * Get supported languages list
   * @returns {Array} List of supported language codes
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * Get language name
   * @param {string} langCode - Language code
   * @returns {string} Language name
   */
  getLanguageName(langCode) {
    const names = {
      en: 'English',
      de: 'Deutsch',
      fr: 'Français',
      it: 'Italiano',
    };
    return names[langCode] || langCode;
  }
}