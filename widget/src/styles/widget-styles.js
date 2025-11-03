/**
 * Widget Styles Module
 * Provides all CSS styles for the AutoRAG widget
 */

export class WidgetStyles {
  constructor(config) {
    this.config = config;
  }

  /**
   * Get the complete stylesheet for the widget
   * @returns {string} CSS styles
   */
  getStyles() {
    const isDark = this.config.theme === 'dark';

    return `
      :host {
        --widget-primary: ${isDark ? '#3b82f6' : '#2563eb'};
        --widget-primary-hover: ${isDark ? '#2563eb' : '#1d4ed8'};
        --widget-bg: ${isDark ? '#1e293b' : '#ffffff'};
        --widget-text: ${isDark ? '#e2e8f0' : '#1e293b'};
        --widget-text-secondary: ${isDark ? '#94a3b8' : '#64748b'};
        --widget-border: ${isDark ? '#334155' : '#e2e8f0'};
        --widget-message-user: ${isDark ? '#3b82f6' : '#2563eb'};
        --widget-message-assistant: ${isDark ? '#334155' : '#f1f5f9'};
        --widget-shadow: 0 10px 40px rgba(0,0,0,${isDark ? '0.3' : '0.15'});
        
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .autorag-widget-container {
        position: fixed;
        z-index: ${this.config.zIndex};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .autorag-widget-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      .autorag-widget-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      .autorag-widget-container.top-right {
        top: 20px;
        right: 20px;
      }
      
      .autorag-widget-container.top-left {
        top: 20px;
        left: 20px;
      }
      
      /* Minimized state - floating button */
      .widget-button {
        background: var(--widget-primary);
        color: white;
        border: none;
        border-radius: 28px;
        padding: 14px 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: var(--widget-shadow);
        font-size: 16px;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        position: relative;
        overflow: hidden;
      }
      
      .widget-button:hover {
        background: var(--widget-primary-hover);
        transform: scale(1.05);
      }
      
      .widget-button:active {
        transform: scale(0.98);
      }
      
      .widget-button svg {
        width: 24px;
        height: 24px;
        pointer-events: none;
      }
      
      .widget-button * {
        pointer-events: none;
      }
      
      /* Expanded state - chat window */
      .widget-chat {
        background: var(--widget-bg);
        border-radius: 16px;
        box-shadow: var(--widget-shadow);
        width: ${this.config.width};
        height: ${this.config.height};
        max-height: calc(100vh - 100px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s ease-out;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Maximized state */
      .widget-chat.maximized {
        width: calc(100vw - 40px);
        height: calc(100vh - 40px);
        max-width: 1200px;
        max-height: calc(100vh - 40px);
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .widget-header {
        background: var(--widget-primary);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 16px 16px 0 0;
      }

      .widget-header h3 {
        font-size: 18px;
        font-weight: 600;
      }

      .widget-header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .widget-maximize,
      .widget-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .widget-close {
        font-size: 28px;
      }

      .widget-maximize:hover,
      .widget-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: var(--widget-bg);
      }
      
      .message {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .message-user {
        background: var(--widget-message-user);
        color: white;
        align-self: flex-end;
        margin-left: auto;
        border-bottom-right-radius: 4px;
      }
      
      .message-assistant {
        background: var(--widget-message-assistant);
        color: var(--widget-text);
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .message-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
        align-self: center;
        text-align: center;
      }
      
      .message-loading {
        background: var(--widget-message-assistant);
        color: var(--widget-text-secondary);
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Source link styling */
      .message a.source-link {
        color: var(--widget-primary);
        text-decoration: underline;
        font-weight: 500;
        transition: opacity 0.2s ease;
      }

      .message a.source-link:hover {
        opacity: 0.8;
      }

      .message-user a.source-link {
        color: rgba(255, 255, 255, 0.9);
      }

      .loading-dots {
        display: flex;
        gap: 4px;
      }
      
      .loading-dots span {
        width: 8px;
        height: 8px;
        background: var(--widget-text-secondary);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;
      }
      
      .loading-dots span:nth-child(1) {
        animation-delay: -0.32s;
      }
      
      .loading-dots span:nth-child(2) {
        animation-delay: -0.16s;
      }
      
      @keyframes bounce {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .widget-input-area {
        padding: 16px;
        border-top: 1px solid var(--widget-border);
        display: flex;
        gap: 12px;
        background: var(--widget-bg);
        border-radius: 0 0 16px 16px;
      }
      
      .widget-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid var(--widget-border);
        border-radius: 8px;
        font-size: 14px;
        resize: none;
        background: var(--widget-bg);
        color: var(--widget-text);
        outline: none;
        transition: border-color 0.2s;
      }
      
      .widget-input:focus {
        border-color: var(--widget-primary);
      }
      
      .widget-send-btn {
        background: var(--widget-primary);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 80px;
      }
      
      .widget-send-btn:hover:not(:disabled) {
        background: var(--widget-primary-hover);
      }
      
      .widget-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .autorag-widget-container {
          bottom: 0 !important;
          right: 0 !important;
          left: 0 !important;
          top: 0 !important;
        }
        
        .widget-chat {
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
        }
        
        .widget-header {
          border-radius: 0;
        }
        
        .widget-input-area {
          border-radius: 0;
        }
      }
      
      /* Accessibility */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
  }
}