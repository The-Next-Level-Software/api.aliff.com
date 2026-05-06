// src/models/user.model.js
import prisma from "../config/prisma.js";
import AuthService from "../services/auth.service.js";
import { PasswordUtils } from "../utils/password.util.js";
import { StringUtils } from "../utils/string.util.js";

/**
 * User Model with Prisma
 * Provides methods for user operations
 */
class UserModel {
  /**
   * Create a new user
   * @param {Object} data - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(data) {
    // Hash password before creating
    if (data.password) {
      data.password = await PasswordUtils.hash(data.password);
    }

    // Generate username if not provided
    if (!data.username && data.name) {
      data.username = StringUtils.generateUsername(data.name);
    }

    return await prisma.user.create({
      data,
      include: {
        role: true,
      },
    });
  }

  /**
   * Find user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
  }

  /**
   * Find user by email
   * @param {String} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: true,
      },
    });
  }

  /**
   * Find user by username
   * @param {String} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
      },
    });
  }

  /**
   * Find one user by conditions
   * @param {Object} where - Where conditions
   * @returns {Promise<Object|null>} User object or null
   */
  static async findOne(where) {
    return await prisma.user.findFirst({
      where,
      include: {
        role: true,
      },
    });
  }

  /**
   * Find all users with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of users
   */
  static async find(options = {}) {
    const { where, skip, take, orderBy } = options;
    return await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        role: true,
      },
    });
  }

  /**
   * Update user by ID
   * @param {String} id - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated user
   */
  static async updateById(id, data) {
    // Hash password if being updated
    if (data.password) {
      data.password = await PasswordUtils.hash(data.password);
    }

    return await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });
  }

  /**
   * Delete user by ID
   * @param {String} id - User ID
   * @returns {Promise<Object>} Deleted user
   */
  static async deleteById(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count users with optional filters
   * @param {Object} where - Where conditions
   * @returns {Promise<Number>} Count of users
   */
  static async count(where = {}) {
    return await prisma.user.count({ where });
  }

  /**
   * Compare password with hashed password
   * @param {String} plainPassword - Plain text password
   * @param {String} hashedPassword - Hashed password
   * @returns {Promise<Boolean>} True if passwords match
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await PasswordUtils.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate auth tokens for user
   * @param {Object} user - User object
   * @param {Object} req - Request object
   * @returns {Promise<Object>} Auth tokens
   */
  static async generateAuthToken(user, req) {
    return await AuthService.generateAuthTokens(user, req);
  }

  /**
   * Logout user by removing session
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<void>}
   */
  static async logout(refreshToken) {
    return await AuthService.logout(refreshToken);
  }
}

export default UserModel;
