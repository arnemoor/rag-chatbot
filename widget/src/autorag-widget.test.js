import { screen, waitFor, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './test-setup.js';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((text) => text),
  },
}));

// Mock config service
vi.mock('./config-service.js', () => ({
  getConfigService: vi.fn(() => ({
    loadConfig: vi.fn().mockResolvedValue({
      apiUrl: 'https://test-api.example.com',
      theme: 'light',
      language: 'en',
    }),
    getApiUrl: vi.fn().mockReturnValue('https://test-api.example.com'),
    getConfig: vi.fn().mockReturnValue({
      apiUrl: 'https://test-api.example.com',
      theme: 'light',
      language: 'en',
    }),
  })),
}));

describe('AutoRAG Widget', () => {
  let widget;
  let container;

  beforeEach(async () => {
    // Import the widget dynamically
    await import('./autorag-widget.js');

    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create widget element
    widget = document.createElement('autorag-widget');
    widget.setAttribute('api-url', 'https://test-api.example.com');
    widget.setAttribute('language', 'en');
    widget.setAttribute('theme', 'light');
    container.appendChild(widget);

    // Wait for widget to initialize
    await waitForAsync();
  });

  afterEach(() => {
    // Clean up
    if (widget && widget.parentNode) {
      widget.parentNode.removeChild(widget);
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create shadow DOM', () => {
      expect(widget.shadowRoot).toBeDefined();
      expect(widget.shadowRoot).not.toBeNull();
    });

    it('should load configuration on connect', async () => {
      await waitFor(() => {
        expect(widget.config).toBeDefined();
        expect(widget.config.apiUrl).toBe('https://test-api.example.com');
      });
    });

    it('should generate session ID', () => {
      expect(widget.sessionId).toBeDefined();
      expect(widget.sessionId).toMatch(/^session-/);
    });

    it('should initialize in minimized state by default', () => {
      expect(widget.isMinimized).toBe(true);
    });

    it('should respect observed attributes', () => {
      const observedAttrs = widget.constructor.observedAttributes;
      expect(observedAttrs).toContain('language');
      expect(observedAttrs).toContain('theme');
      expect(observedAttrs).toContain('api-url');
      expect(observedAttrs).toContain('category');
      expect(observedAttrs).toContain('product');
    });
  });

  describe('Widget UI Rendering', () => {
    it('should render chat button when minimized', async () => {
      await waitFor(() => {
        const button = widget.shadowRoot.querySelector('.chat-button');
        expect(button).toBeDefined();
        expect(button).not.toBeNull();
      });
    });

    it('should show chat window when button clicked', async () => {
      const button = widget.shadowRoot.querySelector('.chat-button');
      expect(button).toBeDefined();

      // Click the button
      fireEvent.click(button);
      await waitForAsync();

      // Check if chat window is visible
      const chatWindow = widget.shadowRoot.querySelector('.chat-window');
      expect(chatWindow).toBeDefined();
      expect(chatWindow.style.display).not.toBe('none');
    });

    it('should render header with title', async () => {
      // Open the widget
      widget.isMinimized = false;
      widget.render();
      await waitForAsync();

      const header = widget.shadowRoot.querySelector('.chat-header');
      expect(header).toBeDefined();
      expect(header.textContent).toContain('Support Assistant');
    });

    it('should render input field and send button', async () => {
      // Open the widget
      widget.isMinimized = false;
      widget.render();
      await waitForAsync();

      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      expect(input).toBeDefined();
      expect(sendButton).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      // Open the widget
      widget.isMinimized = false;
      widget.render();
      await waitForAsync();
    });

    it('should send message when send button clicked', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Type a message
      input.value = 'Test message';

      // Mock fetch response
      global.fetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Test response',
          sessionId: 'test-session-123',
        }),
      );

      // Click send
      fireEvent.click(sendButton);
      await waitForAsync();

      // Check if fetch was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should send message when Enter key pressed', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');

      // Type a message
      input.value = 'Test message with Enter';

      // Mock fetch response
      global.fetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Test response',
          sessionId: 'test-session-123',
        }),
      );

      // Press Enter
      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      await waitForAsync();

      // Check if fetch was called
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should display user message in chat', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Type and send message
      input.value = 'User test message';

      global.fetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'Bot response',
          sessionId: 'test-session-123',
        }),
      );

      fireEvent.click(sendButton);
      await waitForAsync();

      // Check if user message appears
      const messages = widget.shadowRoot.querySelectorAll('.message');
      const userMessage = Array.from(messages).find(
        (m) => m.classList.contains('user-message') && m.textContent.includes('User test message'),
      );

      expect(userMessage).toBeDefined();
    });

    it('should display bot response in chat', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Type and send message
      input.value = 'Test query';

      global.fetch.mockResolvedValueOnce(
        createMockResponse({
          response: 'This is the bot response',
          sessionId: 'test-session-123',
        }),
      );

      fireEvent.click(sendButton);

      // Wait for response
      await waitFor(() => {
        const messages = widget.shadowRoot.querySelectorAll('.message');
        const botMessage = Array.from(messages).find(
          (m) =>
            m.classList.contains('bot-message') &&
            m.textContent.includes('This is the bot response'),
        );
        expect(botMessage).toBeDefined();
      });
    });

    it('should handle empty input', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Leave input empty
      input.value = '';

      // Click send
      fireEvent.click(sendButton);
      await waitForAsync();

      // Should not send request
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Input only whitespace
      input.value = '   ';

      // Click send
      fireEvent.click(sendButton);
      await waitForAsync();

      // Should not send request
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      widget.isMinimized = false;
      widget.render();
      await waitForAsync();
    });

    it('should handle network errors gracefully', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Type a message
      input.value = 'Test message';

      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Click send
      fireEvent.click(sendButton);

      // Wait for error message
      await waitFor(() => {
        const messages = widget.shadowRoot.querySelectorAll('.message');
        const errorMessage = Array.from(messages).find(
          (m) =>
            m.classList.contains('error-message') ||
            m.textContent.includes('error') ||
            m.textContent.includes('Error'),
        );
        expect(errorMessage).toBeDefined();
      });
    });

    it('should handle API errors', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      // Type a message
      input.value = 'Test message';

      // Mock API error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error occurred' }),
      });

      // Click send
      fireEvent.click(sendButton);

      // Wait for error handling
      await waitFor(() => {
        const messages = widget.shadowRoot.querySelectorAll('.message');
        const errorMessage = Array.from(messages).find(
          (m) => m.textContent.includes('error') || m.textContent.includes('Error'),
        );
        expect(errorMessage).toBeDefined();
      });
    });
  });

  describe('State Management', () => {
    it('should save state to localStorage', async () => {
      widget.messages = [
        { type: 'user', content: 'Test message 1' },
        { type: 'bot', content: 'Response 1' },
      ];

      widget.saveState();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'autorag-widget-state',
        expect.stringContaining('Test message 1'),
      );
    });

    it('should load state from localStorage', async () => {
      const savedState = {
        messages: [
          { type: 'user', content: 'Saved message' },
          { type: 'bot', content: 'Saved response' },
        ],
        sessionId: 'saved-session-123',
        isMinimized: false,
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      widget.loadState();

      expect(widget.messages).toHaveLength(2);
      expect(widget.messages[0].content).toBe('Saved message');
      expect(widget.sessionId).toBe('saved-session-123');
    });

    it('should limit message history to prevent memory issues', async () => {
      // Add more than maxMessages
      for (let i = 0; i < 60; i++) {
        widget.messages.push({
          type: i % 2 === 0 ? 'user' : 'bot',
          content: `Message ${i}`,
        });
      }

      widget.trimMessageHistory();

      expect(widget.messages.length).toBeLessThanOrEqual(widget.maxMessages);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      widget.isMinimized = false;
      widget.render();
      await waitForAsync();
    });

    it('should have proper ARIA labels', () => {
      const input = widget.shadowRoot.querySelector('#chat-input');
      const sendButton = widget.shadowRoot.querySelector('#send-button');

      expect(input.getAttribute('aria-label')).toBeDefined();
      expect(sendButton.getAttribute('aria-label')).toBeDefined();
    });

    it('should have proper roles', () => {
      const chatMessages = widget.shadowRoot.querySelector('.chat-messages');
      expect(chatMessages.getAttribute('role')).toBeDefined();
    });

    it('should support keyboard navigation', async () => {
      const input = widget.shadowRoot.querySelector('#chat-input');

      // Focus input
      input.focus();
      expect(widget.shadowRoot.activeElement).toBe(input);
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme', async () => {
      widget.setAttribute('theme', 'light');
      await waitForAsync();

      const wrapper = widget.shadowRoot.querySelector('.widget-wrapper');
      expect(wrapper.classList.contains('theme-light')).toBe(true);
    });

    it('should apply dark theme', async () => {
      widget.setAttribute('theme', 'dark');
      await waitForAsync();

      const wrapper = widget.shadowRoot.querySelector('.widget-wrapper');
      expect(wrapper.classList.contains('theme-dark')).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up on disconnect', () => {
      const saveStateSpy = vi.spyOn(widget, 'saveState');

      // Disconnect the widget
      widget.disconnectedCallback();

      expect(saveStateSpy).toHaveBeenCalled();
      expect(widget.messages).toEqual([]);
    });

    it('should clear timeouts on disconnect', () => {
      // Add a timeout
      const timeoutId = setTimeout(() => {}, 1000);
      widget.timeouts.add(timeoutId);

      // Disconnect
      widget.disconnectedCallback();

      expect(widget.timeouts.size).toBe(0);
    });
  });
});
