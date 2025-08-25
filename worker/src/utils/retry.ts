/**
 * Retry utility with exponential backoff and circuit breaker pattern
 * Provides resilient API calls with automatic retry and failure detection
 */

/**
 * Token bucket implementation for retry budget
 * Prevents retry storms during widespread outages
 */
export class RetryBudget {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  
  constructor(maxTokens = 100, refillRate = 10) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }
  
  /**
   * Check if retry is allowed and consume a token if so
   */
  canRetry(): boolean {
    this.refillTokens();
    
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    
    console.warn('Retry budget exhausted, denying retry');
    return false;
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(elapsed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens);
      this.lastRefill = now;
    }
  }
  
  /**
   * Get current budget status
   */
  getStatus() {
    this.refillTokens();
    return {
      available: this.tokens,
      max: this.maxTokens,
      percentage: (this.tokens / this.maxTokens) * 100,
    };
  }
}

// Global retry budget (shared across all retry operations)
const globalRetryBudget = new RetryBudget(100, 10);

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableErrors?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  useRetryBudget?: boolean; // Whether to use global retry budget
}

/**
 * Executes a function with exponential backoff retry logic
 * @param fn The async function to execute
 * @param options Retry configuration options
 * @returns Promise resolving to the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableErrors = defaultRetryableErrors,
    onRetry = () => {},
    useRetryBudget = true,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if this is the last attempt or if error is not retryable
      if (attempt === maxRetries - 1 || !retryableErrors(error)) {
        throw error;
      }
      
      // Check retry budget if enabled
      if (useRetryBudget && !globalRetryBudget.canRetry()) {
        const budgetError = new Error('Retry budget exhausted');
        (budgetError as any).code = 'RETRY_BUDGET_EXHAUSTED';
        (budgetError as any).originalError = error;
        throw budgetError;
      }
      
      // Calculate delay with exponential backoff and scaled jitter
      const backoffDelay = baseDelay * Math.pow(2, attempt);
      const jitterRange = Math.min(backoffDelay * 0.3, 5000); // 30% jitter, max 5s
      const jitter = Math.random() * jitterRange;
      const delay = Math.min(
        backoffDelay + jitter,
        maxDelay
      );
      
      // Call the retry callback
      onRetry(attempt + 1, error);
      
      // Log the retry attempt
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`,
        { 
          error: error instanceof Error ? error.message : String(error),
          errorType: error?.constructor?.name,
          statusCode: error?.status || error?.statusCode,
        }
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Default function to determine if an error is retryable
 * @param error The error to check
 * @returns True if the error should trigger a retry
 */
function defaultRetryableErrors(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNREFUSED') {
    return true;
  }
  
  // HTTP status codes that are retryable
  const status = error.status || error.statusCode;
  if (status >= 500 || status === 429 || status === 408) {
    return true;
  }
  
  // Specific error messages
  const message = error.message?.toLowerCase() || '';
  if (message.includes('timeout') || 
      message.includes('service unavailable') ||
      message.includes('rate limit') ||
      message.includes('too many requests')) {
    return true;
  }
  
  // Cloudflare-specific errors
  if (message.includes('worker threw exception') ||
      message.includes('script exceeded') ||
      message.includes('cpu time limit')) {
    return true;
  }
  
  return false;
}

/**
 * Circuit breaker implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private stateTransitionInProgress = false;
  private lastCleanup = Date.now();
  private readonly cleanupInterval = 3600000; // 1 hour
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private halfOpenSuccessThreshold = 3,
  ) {}
  
  /**
   * Get the current state of the circuit breaker
   */
  getState(): string {
    return this.state;
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      isOpen: this.state === 'open',
    };
  }
  
  /**
   * Reset the circuit breaker to closed state
   */
  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param fn The async function to execute
   * @returns Promise resolving to the function result
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Cleanup stale state periodically
    this.cleanupIfNeeded();
    
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceLastFailure > this.timeout) {
        // Prevent concurrent state transitions
        if (!this.stateTransitionInProgress) {
          this.stateTransitionInProgress = true;
          try {
            // Double-check state hasn't changed
            if (this.state === 'open') {
              console.info('Circuit breaker transitioning to half-open state');
              this.state = 'half-open';
              this.successCount = 0;
            }
          } finally {
            this.stateTransitionInProgress = false;
          }
        }
      } else {
        const error = new Error(
          `Circuit breaker is open. Retry after ${Math.ceil((this.timeout - timeSinceLastFailure) / 1000)}s`
        );
        (error as any).code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
    }
    
    try {
      const result = await fn();
      
      // Handle success based on current state
      if (this.state === 'half-open') {
        this.successCount++;
        
        // Transition to closed if we've had enough successes
        if (this.successCount >= this.halfOpenSuccessThreshold) {
          console.info('Circuit breaker closing after successful recovery');
          this.state = 'closed';
          this.failures = 0;
        }
      } else if (this.state === 'closed') {
        // Reset failure count on success in closed state
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }
  
  /**
   * Handle a failure and potentially open the circuit
   */
  private handleFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // If in half-open state, immediately open on failure
    if (this.state === 'half-open') {
      console.warn('Circuit breaker opening due to failure in half-open state');
      this.state = 'open';
      this.successCount = 0;
    }
    // If in closed state, check if we should open
    else if (this.state === 'closed' && this.failures >= this.threshold) {
      console.error(
        `Circuit breaker opening after ${this.failures} failures`
      );
      this.state = 'open';
    }
  }
  
  /**
   * Cleanup stale state to prevent memory leaks in long-running isolates
   */
  private cleanupIfNeeded() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      // Reset if circuit has been closed and stable for a while
      if (this.state === 'closed' && this.failures === 0 && 
          now - this.lastFailureTime > this.cleanupInterval) {
        this.reset();
      }
      this.lastCleanup = now;
    }
  }
}

/**
 * Creates a retry function with circuit breaker protection
 * @param breaker The circuit breaker instance
 * @param options Default retry options
 * @returns A function that executes with both retry and circuit breaker logic
 */
export function createResilientFunction<T>(
  breaker: CircuitBreaker,
  options: RetryOptions = {}
) {
  return async (fn: () => Promise<T>): Promise<T> => {
    return breaker.execute(() => retryWithBackoff(fn, options));
  };
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
  /** Quick retry for transient errors */
  quick: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
  } as RetryOptions,
  
  /** Standard retry for API calls */
  standard: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  } as RetryOptions,
  
  /** Aggressive retry for critical operations */
  aggressive: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
  } as RetryOptions,
  
  /** Retry configuration for rate-limited APIs */
  rateLimited: {
    maxRetries: 4,
    baseDelay: 5000,
    maxDelay: 60000,
    retryableErrors: (error: any) => {
      const status = error.status || error.statusCode;
      return status === 429 || defaultRetryableErrors(error);
    },
  } as RetryOptions,
};