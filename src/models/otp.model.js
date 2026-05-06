// src/models/otp.model.js
import prisma from "../config/prisma.js";

/**
 * OTP Model with Prisma
 * Provides methods for OTP operations
 */
class OtpModel {
  /**
   * Create a new OTP
   * @param {Object} data - OTP data
   * @returns {Promise<Object>} Created OTP
   */
  static async create(data) {
    return await prisma.otp.create({
      data,
    });
  }

  /**
   * Find OTP by ID
   * @param {String} id - OTP ID
   * @returns {Promise<Object|null>} OTP object or null
   */
  static async findById(id) {
    return await prisma.otp.findUnique({
      where: { id },
    });
  }

  /**
   * Find OTP by email
   * @param {String} email - Email address
   * @returns {Promise<Object|null>} OTP object or null
   */
  static async findByEmail(email) {
    return await prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find one OTP by conditions
   * @param {Object} where - Where conditions
   * @returns {Promise<Object|null>} OTP object or null
   */
  static async findOne(where) {
    return await prisma.otp.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all OTPs with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of OTPs
   */
  static async find(options = {}) {
    const { where, skip, take, orderBy } = options;
    return await prisma.otp.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Update OTP by ID
   * @param {String} id - OTP ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated OTP
   */
  static async updateById(id, data) {
    return await prisma.otp.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete OTP by ID
   * @param {String} id - OTP ID
   * @returns {Promise<Object>} Deleted OTP
   */
  static async deleteById(id) {
    return await prisma.otp.delete({
      where: { id },
    });
  }

  /**
   * Delete OTPs by email
   * @param {String} email - Email address
   * @returns {Promise<Object>} Delete result
   */
  static async deleteByEmail(email) {
    return await prisma.otp.deleteMany({
      where: { email },
    });
  }

  /**
   * Delete expired OTPs
   * @returns {Promise<Object>} Delete result
   */
  static async deleteExpired() {
    return await prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Count OTPs with optional filters
   * @param {Object} where - Where conditions
   * @returns {Promise<Number>} Count of OTPs
   */
  static async count(where = {}) {
    return await prisma.otp.count({ where });
  }
}

export default OtpModel;
