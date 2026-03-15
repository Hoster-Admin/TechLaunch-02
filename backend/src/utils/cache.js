const NodeCache = require('node-cache');

// Default TTL: 5 minutes, check period: 60 seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Express middleware factory — caches successful GET responses.
 * @param {number} ttl - Cache TTL in seconds (default: 300)
 * @param {string} [keyPrefix] - Optional key prefix
 */
const cacheMiddleware = (ttl = 300, keyPrefix = '') => (req, res, next) => {
  const key = `${keyPrefix}:${req.originalUrl}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return res.json(cached);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success) {
      cache.set(key, body, ttl);
    }
    return originalJson(body);
  };

  next();
};

const clearCache = (pattern) => {
  if (pattern) {
    const keys = cache.keys().filter(k => k.includes(pattern));
    keys.forEach(k => cache.del(k));
  } else {
    cache.flushAll();
  }
};

module.exports = { cache, cacheMiddleware, clearCache };
