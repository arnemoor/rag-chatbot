/**
 * AutoRAG Widget Module Exports
 * Central export file for all widget modules
 */

// Main widget component
export { default as AutoRAGWidget } from './autorag-widget.js';

// Components
export { ChatMessage } from './components/chat-message.js';
export { ChatInput } from './components/chat-input.js';

// Services
export { ApiService, ApiError } from './services/api-service.js';
export { StateManager } from './services/state-manager.js';
export { ConfigurationService, getConfigService } from './config-service.js';

// Utils
export { ThemeManager } from './utils/theme-manager.js';
export { LanguageDetector } from './utils/language-detector.js';

// Styles
export { WidgetStyles } from './styles/widget-styles.js';