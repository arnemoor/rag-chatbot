/**
 * API Service Module
 * Handles all API communication for the widget
 */

export class ApiService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.defaultTimeout = 30000; // 30 seconds
    this.retryAttempts = 2;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Send a chat message to the API
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} API response
   */
  async sendMessage(params) {
    const {
      query,
      language = 'en',
      category = 'general',
      product = 'library',
      provider = 'workers-ai',
      model = '@cf/meta/llama-3.2-3b-instruct',
      sessionId,
    } = params;

    const body = {
      query,
      language,
      category,
      product,
      provider,
      model,
      sessionId,
    };

    return this.request('POST', '', body);
  }

  /**
   * Get configuration from the API
   * @returns {Promise<Object>} Configuration object
   */
  async getConfiguration() {
    return this.request('GET', '/config');
  }

  /**
   * Get available languages
   * @returns {Promise<Array>} Languages array
   */
  async getLanguages() {
    return this.request('GET', '/config/languages');
  }

  /**
   * Get available categories
   * @returns {Promise<Array>} Categories array
   */
  async getCategories() {
    return this.request('GET', '/config/categories');
  }

  /**
   * Get available providers
   * @returns {Promise<Array>} Providers array
   */
  async getProviders() {
    return this.request('GET', '/config/providers');
  }

  /**
   * Get available models
   * @param {string} providerId - Optional provider filter
   * @returns {Promise<Object>} Models object
   */
  async getModels(providerId = null) {
    const endpoint = providerId 
      ? `/config/models?provider=${encodeURIComponent(providerId)}`
      : '/config/models';
    return this.request('GET', endpoint);
  }

  /**
   * Get products for a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Products array
   */
  async getProducts(categoryId) {
    return this.request('GET', `/config/products?category=${encodeURIComponent(categoryId)}`);
  }

  /**
   * Refresh configuration
   * @returns {Promise<Object>} Refresh result
   */
  async refreshConfiguration() {
    return this.request('POST', '/config/refresh');
  }

  /**
   * Make a request to the API
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body (for POST/PUT)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, body = null, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const {
      timeout = this.defaultTimeout,
      headers = {},
      retries = this.retryAttempts,
    } = options;

    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(body);
    }

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await this.fetchWithRetry(url, requestOptions, retries);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          await this.parseErrorResponse(response)
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, { timeout: true });
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error', 0, { originalError: error.message });
    }
  }

  /**
   * Fetch with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithRetry(url, options, retries) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (retries > 0 && this.isRetriableError(error)) {
        await this.delay(this.retryDelay);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retriable
   * @param {Error} error - Error to check
   * @returns {boolean}
   */
  isRetriableError(error) {
    // Retry on network errors or specific status codes
    return (
      error.name === 'NetworkError' ||
      error.name === 'TypeError' || // Often indicates network issues
      (error.status && [502, 503, 504].includes(error.status))
    );
  }

  /**
   * Parse error response
   * @param {Response} response - Error response
   * @returns {Promise<Object>} Error details
   */
  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { message: await response.text() };
    } catch {
      return { message: response.statusText };
    }
  }

  /**
   * Delay helper for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update API URL
   * @param {string} newUrl - New API URL
   */
  setApiUrl(newUrl) {
    this.apiUrl = newUrl;
  }

  /**
   * Health check
   * @returns {Promise<boolean>} API health status
   */
  async healthCheck() {
    try {
      await this.request('GET', '/health', null, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}