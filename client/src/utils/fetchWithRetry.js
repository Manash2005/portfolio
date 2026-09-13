/**
 * Shared fetch utility with exponential-backoff retry logic.
 * Extracted from Skills.jsx, Contact.jsx, and App.jsx to avoid triplication.
 *
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} maxRetries - Maximum number of retry attempts (default 4)
 * @param {number} initialDelay - Initial delay in ms before first retry (default 1500)
 * @returns {Promise<Response>} - Resolved response, or throws after all retries exhausted
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 4, initialDelay = 1500) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout(15000),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    if (i < maxRetries - 1) {
      const delay = initialDelay * Math.pow(1.8, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
