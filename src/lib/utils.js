// Utility functions for the app

// Development mode check
export const isDev = import.meta.env.DEV;

// Safe console logging (only in development)
export const log = (...args) => {
  if (isDev) console.log(...args);
};

export const logError = (...args) => {
  if (isDev) console.error(...args);
};

export const logWarn = (...args) => {
  if (isDev) console.warn(...args);
};

// Retry logic for failed requests
export async function retryRequest(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on AbortError
      if (error.name === 'AbortError') {
        throw error;
      }
      
      // Last attempt, throw the error
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      log(`Retrying request... Attempt ${i + 2}/${retries}`);
    }
  }
}

// Check if error is AbortError
export function isAbortError(error) {
  return error && error.name === 'AbortError';
}

// Safe error message extraction
export function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'حدث خطأ غير معروف';
}

// Create abort controller with timeout
export function createAbortController(timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    controller,
    cleanup: () => clearTimeout(timeoutId)
  };
}
