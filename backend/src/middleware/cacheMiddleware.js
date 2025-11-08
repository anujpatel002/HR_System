// Simple in-memory cache for API responses
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 60000; // 1 minute default
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Delete all keys matching a pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

const cacheManager = new CacheManager();

// Middleware to cache GET requests
const cacheMiddleware = (duration = 60000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}`;
    const cached = cacheManager.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Store the original json function
    const originalJson = res.json.bind(res);

    // Override json function to cache the response
    res.json = (data) => {
      cacheManager.set(key, data, duration);
      return originalJson(data);
    };

    next();
  };
};

module.exports = { cacheManager, cacheMiddleware };
