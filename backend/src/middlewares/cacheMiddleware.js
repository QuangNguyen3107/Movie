// src/middlewares/cacheMiddleware.js - Cache Middleware
const { getCache, setCache, isConnected } = require('../config/redis');

/**
 * Middleware để cache response
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 * @param {function} keyGenerator - Function to generate cache key (optional)
 */
function cacheMiddleware(ttl = 3600, keyGenerator = null) {
    return async (req, res, next) => {
        // Skip cache if Redis is not connected
        if (!isConnected()) {
            return next();
        }

        // Skip cache for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            let cacheKey;
            if (keyGenerator && typeof keyGenerator === 'function') {
                cacheKey = keyGenerator(req);
            } else {
                // Default: use URL + query params + user ID (if available)
                const userId = req.user?.userId || 'guest';
                cacheKey = `cache:${userId}:${req.originalUrl || req.url}`;
            }

            // Try to get from cache
            const cachedData = await getCache(cacheKey);
            
            if (cachedData) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.status(200).json(cachedData);
            }

            console.log(`❌ Cache MISS: ${cacheKey}`);

            // Store original res.json function
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function(data) {
                // Only cache successful responses (200-299)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    setCache(cacheKey, data, ttl)
                        .then(() => {
                            console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`);
                        })
                        .catch(err => {
                            console.error('❌ Cache SET error:', err);
                        });
                }
                
                return originalJson(data);
            };

            next();

        } catch (error) {
            console.error('❌ Cache middleware error:', error);
            next();
        }
    };
}

/**
 * Cache middleware for movie details
 * TTL: 2 hours (movies don't change often)
 */
function cacheMovieDetails(ttl = 7200) {
    return cacheMiddleware(ttl, (req) => {
        return `cache:movie:${req.params.slug || req.params.id}`;
    });
}

/**
 * Cache middleware for movie list
 * TTL: 30 minutes (list changes more frequently)
 */
function cacheMovieList(ttl = 1800) {
    return cacheMiddleware(ttl, (req) => {
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        const category = req.query.category || 'all';
        const sort = req.query.sort || 'createdAt';
        return `cache:movies:${category}:${sort}:${page}:${limit}`;
    });
}

/**
 * Cache middleware for search results
 * TTL: 15 minutes (search results can be cached shorter)
 */
function cacheSearchResults(ttl = 900) {
    return cacheMiddleware(ttl, (req) => {
        const query = req.query.q || '';
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        return `cache:search:${encodeURIComponent(query)}:${page}:${limit}`;
    });
}

/**
 * Cache middleware for user-specific data
 * TTL: 10 minutes (user data changes more frequently)
 */
function cacheUserData(ttl = 600) {
    return cacheMiddleware(ttl, (req) => {
        const userId = req.user?.userId || 'guest';
        const path = req.path;
        return `cache:user:${userId}:${path}`;
    });
}

module.exports = {
    cacheMiddleware,
    cacheMovieDetails,
    cacheMovieList,
    cacheSearchResults,
    cacheUserData
};
