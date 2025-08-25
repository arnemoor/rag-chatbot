/**
 * Test setup file for Widget tests
 * Configures the test environment and provides global utilities
 */

import { afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
}));

// Define custom elements if not defined
if (!customElements.get('autorag-widget')) {
  customElements.define(
    'autorag-widget',
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }
    },
  );
}

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset localStorage mock
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();

  // Reset fetch mock
  global.fetch.mockReset();

  // Setup default fetch response
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
    text: async () => '',
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
  });
});

afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = '';

  // Clear all timers
  vi.clearAllTimers();

  // Restore all mocks
  vi.restoreAllMocks();
});

// Helper to wait for async updates
global.waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Helper to create a mock fetch response
global.createMockResponse = (data, options = {}) =>
  Promise.resolve({
    ok: options.ok !== undefined ? options.ok : true,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(options.headers || {}),
  });

// Helper to trigger custom events
global.triggerCustomEvent = (element, eventName, detail = {}) => {
  const event = new CustomEvent(eventName, { detail, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
};

// Helper to wait for element to appear in DOM
global.waitForElement = async (selector, container = document.body, timeout = 3000) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = container.querySelector(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Element ${selector} not found after ${timeout}ms`);
};

// Export test utilities
export { localStorageMock, sessionStorageMock };
