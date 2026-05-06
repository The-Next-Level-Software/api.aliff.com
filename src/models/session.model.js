// src/models/session.model.js
import prisma from "../config/prisma.js";

/**
 * Session Model with Prisma
 * Provides methods for session operations
 */
class SessionModel {
  /**
   * Create a new session
   * @param {Object} data - Session data
   * @returns {Promise<Object>} Created session
   */
  static async create(data) {
    return await prisma.session.create({
      data,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find session by ID
   * @param {String} id - Session ID
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findById(id) {
    return await prisma.session.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find session by refresh token
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findByRefreshToken(refreshToken) {
    return await prisma.session.findFirst({
      where: { refreshToken },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find one session by conditions
   * @param {Object} where - Where conditions
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findOne(where) {
    return await prisma.session.findFirst({
      where,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find all sessions with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of sessions
   */
  static async find(options = {}) {
    const { where, skip, take, orderBy } = options;
    return await prisma.session.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update session by ID
   * @param {String} id - Session ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated session
   */
  static async updateById(id, data) {
    return await prisma.session.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update session by refresh token
   * @param {String} refreshToken - Refresh token
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated session
   */
  static async updateByRefreshToken(refreshToken, data) {
    return await prisma.session.updateMany({
      where: { refreshToken },
      data,
    });
  }

  /**
   * Delete session by ID
   * @param {String} id - Session ID
   * @returns {Promise<Object>} Deleted session
   */
  static async deleteById(id) {
    return await prisma.session.delete({
      where: { id },
    });
  }

  /**
   * Delete session by refresh token
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<Object>} Delete result
   */
  static async deleteByRefreshToken(refreshToken) {
    return await prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  /**
   * Delete all sessions for a user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  static async deleteByUserId(userId) {
    return await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Count sessions with optional filters
   * @param {Object} where - Where conditions
   * @returns {Promise<Number>} Count of sessions
   */
  static async count(where = {}) {
    return await prisma.session.count({ where });
  }
}

export default SessionModel;
