/**
 * Test utilities for Widget testing
 * Provides helper functions and mocks for testing web components
 */

import { vi } from 'vitest';

/**
 * Creates a mock shadow root for testing
 */
export function createMockShadowRoot() {
  const shadowRoot = document.createElement('div');
  shadowRoot.innerHTML = '';
  shadowRoot.querySelector = vi.fn((selector) => shadowRoot.querySelector(selector));
  shadowRoot.querySelectorAll = vi.fn((selector) => shadowRoot.querySelectorAll(selector));
  return shadowRoot;
}

/**
 * Creates a mock web component
 */
export function createMockWebComponent(tagName = 'test-component') {
  class MockComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._connected = false;
    }

    connectedCallback() {
      this._connected = true;
    }

    disconnectedCallback() {
      this._connected = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      this[`_${name}`] = newValue;
    }

    static get observedAttributes() {
      return [];
    }
  }

  if (!customElements.get(tagName)) {
    customElements.define(tagName, MockComponent);
  }

  return document.createElement(tagName);
}

/**
 * Waits for a web component to be defined
 */
export async function waitForComponentDefinition(tagName, timeout = 5000) {
  const startTime = Date.now();

  while (!customElements.get(tagName)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Component ${tagName} was not defined within ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return customElements.get(tagName);
}

/**
 * Creates a mock fetch response for testing
 */
export function mockFetchResponse(data, options = {}) {
  return {
    ok: options.ok !== undefined ? options.ok : true,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: new Headers(options.headers || {}),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    formData: vi.fn().mockResolvedValue(new FormData()),
    clone: vi.fn().mockReturnThis(),
  };
}

/**
 * Sets up fetch mock with multiple responses
 */
export function setupFetchMock(responses) {
  let callIndex = 0;

  global.fetch = vi.fn().mockImplementation((url, options) => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex++;

    if (response instanceof Error) {
      return Promise.reject(response);
    }

    return Promise.resolve(mockFetchResponse(response.data, response.options));
  });

  return global.fetch;
}

/**
 * Triggers a custom event on an element
 */
export function triggerEvent(element, eventName, detail = {}) {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true,
  });
  return element.dispatchEvent(event);
}

/**
 * Simulates user typing in an input
 */
export async function typeInInput(input, text, delay = 10) {
  input.focus();
  input.value = '';

  for (const char of text) {
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Waits for an element to appear in the shadow DOM
 */
export async function waitForShadowElement(shadowRoot, selector, timeout = 3000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = shadowRoot.querySelector(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Element ${selector} not found in shadow DOM after ${timeout}ms`);
}

/**
 * Creates a mock localStorage
 */
export function createMockLocalStorage() {
  const store = new Map();

  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size;
    },
    key: vi.fn((index) => {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    }),
  };
}

/**
 * Creates a mock WebSocket
 */
export function createMockWebSocket() {
  return class MockWebSocket {
    constructor(url, protocols) {
      this.url = url;
      this.protocols = protocols;
      this.readyState = 0; // CONNECTING
      this.onopen = null;
      this.onclose = null;
      this.onerror = null;
      this.onmessage = null;

      // Simulate connection
      setTimeout(() => {
        this.readyState = 1; // OPEN
        if (this.onopen) {
          this.onopen(new Event('open'));
        }
      }, 10);
    }

    send(data) {
      if (this.readyState !== 1) {
        throw new Error('WebSocket is not open');
      }
      // Mock echo response
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage(new MessageEvent('message', { data }));
        }
      }, 10);
    }

    close(code, reason) {
      this.readyState = 2; // CLOSING
      setTimeout(() => {
        this.readyState = 3; // CLOSED
        if (this.onclose) {
          this.onclose(new CloseEvent('close', { code, reason }));
        }
      }, 10);
    }
  };
}

/**
 * Waits for animation frame
 */
export function waitForAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * Flushes all pending promises
 */
export async function flushPromises() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

/**
 * Creates a mock IntersectionObserver
 */
export function createMockIntersectionObserver(options = {}) {
  const { isIntersecting = true, threshold = 0 } = options;

  return class MockIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.elements = new Set();
    }

    observe(element) {
      this.elements.add(element);
      // Trigger callback immediately for testing
      setTimeout(() => {
        this.callback(
          [
            {
              target: element,
              isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: element.getBoundingClientRect(),
              intersectionRect: element.getBoundingClientRect(),
              rootBounds: null,
              time: Date.now(),
            },
          ],
          this,
        );
      }, 0);
    }

    unobserve(element) {
      this.elements.delete(element);
    }

    disconnect() {
      this.elements.clear();
    }
  };
}

/**
 * Simulates drag and drop
 */
export function simulateDragAndDrop(dragElement, dropTarget) {
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer(),
  });

  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer(),
  });

  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer(),
  });

  const dragEndEvent = new DragEvent('dragend', {
    bubbles: true,
    cancelable: true,
  });

  dragElement.dispatchEvent(dragStartEvent);
  dropTarget.dispatchEvent(dragOverEvent);
  dropTarget.dispatchEvent(dropEvent);
  dragElement.dispatchEvent(dragEndEvent);
}

/**
 * Creates a mock ResizeObserver
 */
export function createMockResizeObserver() {
  return class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.elements = new Set();
    }

    observe(element) {
      this.elements.add(element);
      // Trigger callback with mock entry
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        this.callback(
          [
            {
              target: element,
              contentRect: rect,
              borderBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
              contentBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
              devicePixelContentBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
            },
          ],
          this,
        );
      }, 0);
    }

    unobserve(element) {
      this.elements.delete(element);
    }

    disconnect() {
      this.elements.clear();
    }
  };
}

export default {
  createMockShadowRoot,
  createMockWebComponent,
  waitForComponentDefinition,
  mockFetchResponse,
  setupFetchMock,
  triggerEvent,
  typeInInput,
  waitForShadowElement,
  createMockLocalStorage,
  createMockWebSocket,
  waitForAnimationFrame,
  flushPromises,
  createMockIntersectionObserver,
  simulateDragAndDrop,
  createMockResizeObserver,
};
