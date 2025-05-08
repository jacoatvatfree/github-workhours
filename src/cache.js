'use strict';

const NodeCache = require('node-cache');
const { createClient } = require('redis');

/**
 * Create a cache provider based on available configuration.
 * Uses Redis if REDIS_URL is set, otherwise falls back to in-memory cache.
 * 
 * @returns {Object} Cache provider with get/set methods
 */
async function createCache() {
  // Default in-memory cache (1 hour TTL)
  const memoryCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });
  
  // If Redis is configured, use it
  if (process.env.REDIS_URL) {
    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL
      });
      
      await redisClient.connect();
      
      // Redis cache with 24 hour TTL
      return {
        async get(key) {
          const value = await redisClient.get(key);
          if (value) {
            return JSON.parse(value);
          }
          return null;
        },
        async set(key, value) {
          // 24 hour TTL (in seconds)
          await redisClient.set(key, JSON.stringify(value), { EX: 24 * 60 * 60 });
        },
        async close() {
          await redisClient.quit();
        }
      };
    } catch (error) {
      console.warn(`Redis connection failed: ${error.message}. Falling back to in-memory cache.`);
    }
  }
  
  // Fallback to in-memory cache
  return {
    async get(key) {
      return memoryCache.get(key);
    },
    async set(key, value) {
      memoryCache.set(key, value);
    },
    async close() {
      // No-op for memory cache
    }
  };
}

module.exports = { createCache };
