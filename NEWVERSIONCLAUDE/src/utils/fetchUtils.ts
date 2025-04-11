import { Logger } from './logger';

/**
 * Configuration for fetch operations
 */
export const FetchConfig = {
  MAX_CONCURRENT: 4,
  TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
};

/**
 * Fetch with timeout functionality
 */
export async function timeoutFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FetchConfig.TIMEOUT_MS);

  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Execute async tasks with limited concurrency
 */
export async function asyncPool<T>(
  taskFns: (() => Promise<T>)[],
  concurrency: number = FetchConfig.MAX_CONCURRENT
): Promise<(T | null)[]> {
  const results: (T | null)[] = [];
  const executing: Promise<void>[] = [];

  for (const taskFn of taskFns) {
    const p = (async () => {
      try {
        const result = await taskFn();
        results.push(result);
      } catch (error) {
        Logger.api.error('Task in async pool failed', { error });
        results.push(null);
      }
    })();

    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing.map(p => p.catch(() => {})));
      // Filter out completed promises
      const stillExecuting = executing.filter(p => p.then(() => false, () => false));
      executing.length = 0;
      executing.push(...stillExecuting);
    }
  }

  await Promise.allSettled(executing);
  return results;
}

/**
 * Generate natural-looking browser headers
 */
export function getBrowserHeaders(): Record<string, string> {
  return {
    'User-Agent': navigator.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': navigator.language || 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
  };
}

/**
 * Fetch with exponential backoff retries
 */
export async function fetchWithRetries(
  url: string,
  options: RequestInit = {},
  retries: number = FetchConfig.MAX_RETRIES,
  baseDelay: number = FetchConfig.BASE_DELAY_MS
): Promise<Response | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add natural delay between retries with some randomization
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(1.5, attempt - 1) * (0.75 + Math.random() * 0.5);
        Logger.api.debug(`Retry attempt ${attempt} for ${url}, waiting ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await timeoutFetch(url, options);
      
      // Log different status codes appropriately
      if (response.status === 404) {
        Logger.api.debug(`Resource not found (404): ${url}`);
      } else if (!response.ok) {
        Logger.api.warn(`HTTP error ${response.status} for ${url}`);
        // For 429 (Too Many Requests) or 503 (Service Unavailable), add extra delay
        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          const extraDelay = baseDelay * 2 * (attempt + 1);
          Logger.api.warn(`Rate limited, adding extra ${extraDelay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, extraDelay));
        }
        // Still return the response for status-specific handling
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      Logger.api.error(`Fetch error (attempt ${attempt + 1}/${retries + 1})`, { 
        url, 
        error: lastError.message,
        errorName: lastError.name,
        isAbort: lastError.name === 'AbortError',
        stack: lastError.stack?.split('\n')[0] || 'No stack trace'
      });
      
      // Don't retry on abort (timeout) unless it's the last attempt
      if (lastError.name === 'AbortError' && attempt < retries - 1) {
        continue;
      }
    }
  }
  
  // Return null after all retries
  return null;
}

/**
 * Main fetch utility that combines all optimizations
 */
export async function enhancedFetch(
  url: string, 
  options: RequestInit = {},
  includeCredentials: boolean = true
): Promise<Response | null> {
  // Combine provided options with default headers
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...getBrowserHeaders(),
      ...(options.headers || {})
    },
    credentials: includeCredentials ? 'include' : 'omit'
  };

  return fetchWithRetries(url, enhancedOptions);
}

/**
 * Simple fetch with minimal headers for strict CORS APIs
 * This avoids preflight requests by using only simple headers
 */
export async function simpleFetch(url: string): Promise<Response | null> {
  try {
    // Use minimal headers to avoid CORS preflight
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      // Only include basic headers that don't trigger preflight
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      Logger.api.warn(`HTTP error ${response.status} for ${url}`);
    }
    
    return response;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    Logger.api.error(`Simple fetch error for ${url}`, { 
      error: err.message,
      errorName: err.name
    });
    return null;
  }
} 