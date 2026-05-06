import Redis from "ioredis";

import appConfig from "../config/index.js";

/**
 * Cache Service using Redis
 */
class CacheService {
  constructor() {
    this.client = new Redis({
      host: appConfig.REDIS_HOST || "127.0.0.1",
      port: Number(appConfig.REDIS_PORT) || 6379,
      password: appConfig.REDIS_PASSWORD || undefined,
      db: Number(appConfig.REDIS_DB) || 0,
      maxRetriesPerRequest: null,
    });

    this.client.on("connect", () => console.log("✅ Redis connected"));
    this.client.on("error", (err) => console.error("❌ Redis error:", err));
  }

  /**
   * Set a key in Redis with optional expiry (seconds)
   */
  async set(key, value, ttl = 3600) {
    if (typeof value !== "string") value = JSON.stringify(value);
    if (ttl > 0) {
      return this.client.set(key, value, "EX", ttl);
    } else {
      return this.client.set(key, value);
    }
  }

  /**
   * Get a key from Redis
   */
  async get(key) {
    const value = await this.client.get(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Delete a key
   */
  async del(key) {
    return this.client.del(key);
  }

  /**
   * Check if a key exists
   */
  async exists(key) {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValueObj, ttl = 3600) {
    const pipeline = this.client.pipeline();
    for (const key in keyValueObj) {
      let value = keyValueObj[key];
      if (typeof value !== "string") value = JSON.stringify(value);
      if (ttl > 0) {
        pipeline.set(key, value, "EX", ttl);
      } else {
        pipeline.set(key, value);
      }
    }
    return pipeline.exec();
  }

  /**
   * Flush all cache (use with caution)
   */
  async flushAll() {
    return this.client.flushall();
  }

  /**
   * Close connection
   */
  async quit() {
    return this.client.quit();
  }
}

// Singleton instance
export const cacheService = new CacheService();
