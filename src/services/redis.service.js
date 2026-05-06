import redisClient from "../startup/redis.util.js";

// services/redisService.js
/**
 * Redis Service
 * Provides utility functions to interact with Redis
 */

const DEFAULT_TTL = 60; // default TTL in seconds

const RedisService = {
  /**
   * Get value from Redis
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Redis GET error:", err);
      return null; // fallback if Redis fails
    }
  },

  /**
   * Set value in Redis with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds
   */
  async set(key, value, ttlSeconds = DEFAULT_TTL) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error("Redis SET error:", err);
    }
  },

  /**
   * Delete a key from Redis
   * @param {string} key
   */
  async del(key) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error("Redis DEL error:", err);
    }
  },

  /**
   * Generate cache key for generic usage
   * Example: key = users:page=1:limit=10
   * @param {string} prefix
   * @param {object} params
   * @returns {string}
   */
  generateKey(prefix, params = {}) {
    const paramString = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join(":");
    return paramString ? `${prefix}:${paramString}` : prefix;
  },

  /**
   * Clear multiple keys by pattern (optional)
   * WARNING: Can be heavy if many keys
   * @param {string} pattern
   */
  async clearByPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.error("Redis clearByPattern error:", err);
    }
  },
};

export default RedisService;
