/**
 * Client-side Input Validation Module
 * Provides comprehensive validation and sanitization for user inputs
 * before sending to the API
 */

import DOMPurify from 'dompurify';

/**
 * Validation constraints
 */
const CONSTRAINTS = {
  query: {
    minLength: 1,
    maxLength: 2000,
    required: true
  },
  sessionId: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/,
    required: false
  },
  language: {
    validValues: ['en', 'de', 'fr', 'it'],
    required: false
  },
  provider: {
    validValues: ['workers-ai', 'openai', 'anthropic'],
    required: false
  },
  category: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    required: false
  },
  product: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    required: false
  },
  model: {
    maxLength: 100,
    pattern: /^[@a-zA-Z0-9:._/-]+$/,  // Added @ for Workers AI models like @cf/meta/...
    required: false
  }
};

/**
 * DOMPurify configuration for strict sanitization
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [], // No HTML tags allowed in chat input
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  USE_PROFILES: { html: false, svg: false, mathMl: false }
};

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Sanitize text input using DOMPurify
 * @param {string} input - Raw input text
 * @returns {string} Sanitized text
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Use DOMPurify with strict configuration
  const sanitized = DOMPurify.sanitize(input, PURIFY_CONFIG);
  
  // Additional sanitization: remove control characters except newlines and tabs
  return sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {*} value - Field value
 * @param {Object} constraint - Validation constraint
 * @returns {string|null} Error message or null if valid
 */
function validateField(field, value, constraint) {
  // Check required
  if (constraint.required && !value) {
    return `${field} is required`;
  }
  
  // Skip validation for optional empty fields
  if (!constraint.required && !value) {
    return null;
  }
  
  // Type check
  if (value && typeof value !== 'string') {
    return `${field} must be a string`;
  }
  
  // Length validation
  if (constraint.minLength && value.length < constraint.minLength) {
    return `${field} must be at least ${constraint.minLength} character(s)`;
  }
  
  if (constraint.maxLength && value.length > constraint.maxLength) {
    return `${field} must not exceed ${constraint.maxLength} characters`;
  }
  
  // Pattern validation
  if (constraint.pattern && !constraint.pattern.test(value)) {
    return `${field} contains invalid characters`;
  }
  
  // Valid values validation
  if (constraint.validValues && !constraint.validValues.includes(value)) {
    return `${field} must be one of: ${constraint.validValues.join(', ')}`;
  }
  
  return null;
}

/**
 * Validate chat input before sending to API
 * @param {Object} input - Input object
 * @returns {Object} Validation result with sanitized data
 */
export function validateChatInput(input) {
  const errors = [];
  const sanitized = {};
  
  // Validate and sanitize query
  if (input.query) {
    sanitized.query = sanitizeText(input.query);
    const error = validateField('query', sanitized.query, CONSTRAINTS.query);
    if (error) {
      errors.push(new ValidationError('query', error));
    }
  } else if (CONSTRAINTS.query.required) {
    errors.push(new ValidationError('query', 'Query is required'));
  }
  
  // Validate optional fields
  const optionalFields = ['sessionId', 'language', 'provider', 'category', 'product', 'model'];
  
  for (const field of optionalFields) {
    if (input[field]) {
      // Don't sanitize with DOMPurify for non-text fields, just trim
      sanitized[field] = typeof input[field] === 'string' ? input[field].trim() : input[field];
      
      const constraint = CONSTRAINTS[field];
      if (constraint) {
        const error = validateField(field, sanitized[field], constraint);
        if (error) {
          errors.push(new ValidationError(field, error));
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Validate configuration values
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
export function validateConfiguration(config) {
  const errors = [];
  
  // Validate API URL
  if (config.apiUrl) {
    try {
      const url = new URL(config.apiUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push(new ValidationError('apiUrl', 'API URL must use HTTP or HTTPS protocol'));
      }
    } catch (e) {
      errors.push(new ValidationError('apiUrl', 'Invalid API URL format'));
    }
  }
  
  // Validate language
  if (config.language && !CONSTRAINTS.language.validValues.includes(config.language)) {
    errors.push(new ValidationError('language', `Invalid language: ${config.language}`));
  }
  
  // Validate provider
  if (config.provider && !CONSTRAINTS.provider.validValues.includes(config.provider)) {
    errors.push(new ValidationError('provider', `Invalid provider: ${config.provider}`));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Escape HTML for safe display
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate file for upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'text/csv'],
    allowedExtensions = ['.pdf', '.txt', '.md', '.csv']
  } = options;
  
  const errors = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(new ValidationError('file', `File size exceeds ${maxSize / 1024 / 1024}MB limit`));
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(new ValidationError('file', `File type ${file.type} is not allowed`));
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    errors.push(new ValidationError('file', `File extension ${extension} is not allowed`));
  }
  
  // Check filename for dangerous patterns
  const dangerousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid filename characters
    /^\./, // Hidden files
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.name)) {
      errors.push(new ValidationError('file', 'Filename contains invalid characters'));
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting for client-side requests
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  /**
   * Check if request is allowed
   * @returns {boolean} True if request is allowed
   */
  isAllowed() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we're under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get time until next request is allowed
   * @returns {number} Milliseconds until next request
   */
  timeUntilNextRequest() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const timeElapsed = Date.now() - oldestRequest;
    
    return Math.max(0, this.windowMs - timeElapsed);
  }
  
  /**
   * Reset the rate limiter
   */
  reset() {
    this.requests = [];
  }
}

// Export a default rate limiter instance
export const defaultRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

/**
 * Validate and rate limit a request
 * @param {Object} input - Request input
 * @returns {Object} Validation result with rate limit check
 */
export function validateAndRateLimit(input) {
  // Check rate limit first
  if (!defaultRateLimiter.isAllowed()) {
    const waitTime = defaultRateLimiter.timeUntilNextRequest();
    return {
      isValid: false,
      errors: [new ValidationError('rateLimit', `Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)],
      rateLimited: true,
      retryAfter: waitTime
    };
  }
  
  // Validate input
  const validation = validateChatInput(input);
  
  return {
    ...validation,
    rateLimited: false
  };
}