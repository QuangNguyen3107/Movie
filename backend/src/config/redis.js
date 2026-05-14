const redis = require('redis');
require('dotenv').config();

let redisClient = null;
let isRedisConnected = false;

async function initRedis() {
    try {
        if (process.env.REDIS_ENABLED !== 'true') {
            console.log('⚠️ Redis is disabled. Set REDIS_ENABLED=true in .env to enable caching.');
            return null;
        }

        const redisConfig = {
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                connectTimeout: 10000,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis: Max reconnection attempts reached');
                        return new Error('Redis reconnection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            },
            database: process.env.REDIS_DB || 0
        };

        if (process.env.REDIS_PASSWORD) {
            redisConfig.password = process.env.REDIS_PASSWORD;
        }

        redisClient = redis.createClient(redisConfig);

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err);
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('🔌 Redis Client Connecting...');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis Client Ready');
            isRedisConnected = true;
        });

        redisClient.on('end', () => {
            console.log('📤 Redis Client Disconnected');
            isRedisConnected = false;
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis Client Reconnecting...');
        });

        await redisClient.connect();
        return redisClient;

    } catch (error) {
        console.error('❌ Redis initialization error:', error);
        isRedisConnected = false;
        return null;
    }
}

async function getCache(key) {
    if (!isRedisConnected || !redisClient) {
        return null;
    }

    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Redis GET error:', error);
        return null;
    }
}

async function setCache(key, value, ttl = 3600) {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('❌ Redis SET error:', error);
        return false;
    }
}

async function deleteCache(key) {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('❌ Redis DELETE error:', error);
        return false;
    }
}

async function deleteCachePattern(pattern) {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        return true;
    } catch (error) {
        console.error('❌ Redis DELETE PATTERN error:', error);
        return false;
    }
}

async function clearAllCache() {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        await redisClient.flushDb();
        return true;
    } catch (error) {
        console.error('❌ Redis FLUSH error:', error);
        return false;
    }
}

function isConnected() {
    return isRedisConnected;
}
async function closeRedis() {
    if (redisClient) {
        try {
            await redisClient.quit();
            console.log('🔐 Redis connection closed');
        } catch (error) {
            console.error('❌ Error closing Redis:', error);
        }
    }
}

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    deleteCachePattern,
    clearAllCache,
    isConnected,
    closeRedis,
    getClient: () => redisClient
};
