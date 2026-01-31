// Client-side caching utility for Bekya application
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes cache expiration
  }

  // Generate cache key based on parameters
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {});
    
    return `${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  // Store data in cache
  set(key, data, maxAge = this.maxAge) {
    const cacheEntry = {
      data: data,
      timestamp: Date.now(),
      expiresAt: Date.now() + maxAge
    };
    
    this.cache.set(key, cacheEntry);
    console.log(`[Cache] Stored: ${key}`);
  }

  // Get data from cache if valid
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`[Cache] Miss: ${key}`);
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      console.log(`[Cache] Expired: ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`[Cache] Hit: ${key}`);
    return entry.data;
  }

  // Check if cache entry exists and is valid
  hasValid(key) {
    const entry = this.cache.get(key);
    return entry && Date.now() <= entry.expiresAt;
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        valid++;
      } else {
        expired++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: valid + expired > 0 ? (valid / (valid + expired) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Auto cleanup every 10 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 10 * 60 * 1000);

// Export for use in components
export default cacheManager;

// Utility functions for common caching patterns
export const cacheUtils = {
  // Cache product data
  cacheProducts: (products, location = null) => {
    const key = cacheManager.generateKey('products', { location });
    cacheManager.set(key, products);
  },
  
  // Get cached products
  getCachedProducts: (location = null) => {
    const key = cacheManager.generateKey('products', { location });
    return cacheManager.get(key);
  },
  
  // Cache user products
  cacheUserProducts: (userId, products) => {
    const key = cacheManager.generateKey('user_products', { userId });
    cacheManager.set(key, products, 3 * 60 * 1000); // 3 minutes for user products
  },
  
  // Get cached user products
  getCachedUserProducts: (userId) => {
    const key = cacheManager.generateKey('user_products', { userId });
    return cacheManager.get(key);
  },
  
  // Cache offers
  cacheOffers: (offers, location = null) => {
    const key = cacheManager.generateKey('offers', { location });
    cacheManager.set(key, offers);
  },
  
  // Get cached offers
  getCachedOffers: (location = null) => {
    const key = cacheManager.generateKey('offers', { location });
    return cacheManager.get(key);
  }
};