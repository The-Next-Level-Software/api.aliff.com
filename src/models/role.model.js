// src/models/role.model.js
import prisma from "../config/prisma.js";

/**
 * Role Model with Prisma
 * Provides methods for role operations
 */
class RoleModel {
  /**
   * Create a new role
   * @param {Object} data - Role data
   * @returns {Promise<Object>} Created role
   */
  static async create(data) {
    return await prisma.role.create({
      data,
    });
  }

  /**
   * Find role by ID
   * @param {String} id - Role ID
   * @returns {Promise<Object|null>} Role object or null
   */
  static async findById(id) {
    return await prisma.role.findUnique({
      where: { id },
    });
  }

  /**
   * Find role by name
   * @param {String} name - Role name
   * @returns {Promise<Object|null>} Role object or null
   */
  static async findByName(name) {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Find one role by conditions
   * @param {Object} where - Where conditions
   * @returns {Promise<Object|null>} Role object or null
   */
  static async findOne(where) {
    return await prisma.role.findFirst({
      where,
    });
  }

  /**
   * Find all roles with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of roles
   */
  static async find(options = {}) {
    const { where, skip, take, orderBy } = options;
    return await prisma.role.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Update role by ID
   * @param {String} id - Role ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated role
   */
  static async updateById(id, data) {
    return await prisma.role.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete role by ID
   * @param {String} id - Role ID
   * @returns {Promise<Object>} Deleted role
   */
  static async deleteById(id) {
    return await prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Count roles with optional filters
   * @param {Object} where - Where conditions
   * @returns {Promise<Number>} Count of roles
   */
  static async count(where = {}) {
    return await prisma.role.count({ where });
  }
}

export default RoleModel;
