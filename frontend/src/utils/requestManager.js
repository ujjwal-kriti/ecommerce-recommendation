// Global request manager to prevent duplicate API calls
class RequestManager {
  constructor() {
    this.pendingRequests = new Map();
    this.requestCache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  // Generate a unique key for the request
  generateKey(url, method = 'GET', data = null) {
    const dataString = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataString}`;
  }

  // Check if request is already pending
  isPending(key) {
    return this.pendingRequests.has(key);
  }

  // Check if we have cached data that's still valid
  getCached(key) {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Set pending request
  setPending(key, promise) {
    this.pendingRequests.set(key, promise);
  }

  // Clear pending request
  clearPending(key) {
    this.pendingRequests.delete(key);
  }

  // Cache successful response
  setCache(key, data) {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache for a specific pattern
  clearCache(pattern) {
    for (const [key] of this.requestCache) {
      if (key.includes(pattern)) {
        this.requestCache.delete(key);
      }
    }
  }

  // Get or create request
  async getOrCreate(key, requestFn) {
    // Check cache first
    const cached = this.getCached(key);
    if (cached) {
      return cached;
    }

    // Check if already pending
    if (this.isPending(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn()
      .then(response => {
        // Cache successful response
        this.setCache(key, response);
        return response;
      })
      .finally(() => {
        // Clear pending request
        this.clearPending(key);
      });

    this.setPending(key, promise);
    return promise;
  }

  // Clear all caches
  clearAllCaches() {
    this.requestCache.clear();
    this.pendingRequests.clear();
  }
}

// Create singleton instance
const requestManager = new RequestManager();

export default requestManager;

