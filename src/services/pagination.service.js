import appConfig from "../config/index.js";

/**
 * Pagination Service
 * Provides helpers to paginate data and generate metadata
 */
export class PaginationService {
  /**
   * Calculate pagination parameters
   * @param {number} page - current page (1-based)
   * @param {number} limit - items per page
   * @returns {object} - { skip, limit, page }
   */
  static getPagination(
    page = appConfig.pagination.defaultPage,
    limit = appConfig.pagination.defaultLimit
  ) {
    const safeLimit = Math.max(1, parseInt(limit, 10));
    const safePage = Math.max(1, parseInt(page, 10));
    const skip = (safePage - 1) * safeLimit;
    return { skip, limit: safeLimit, page: safePage };
  }

  /**
   * Generate pagination metadata for response
   * @param {number} totalItems - total number of items
   * @param {number} page - current page
   * @param {number} limit - items per page
   * @returns {object} - { totalItems, totalPages, currentPage, pageSize, hasNext, hasPrev }
   */
  static getMeta(
    totalItems,
    page = appConfig.pagination.defaultPage,
    limit = appConfig.pagination.defaultLimit
  ) {
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.min(page, totalPages);
    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize: limit,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };
  }

  /**
   * Paginate an array of data
   * @param {Array} items - full array of items
   * @param {number} page
   * @param {number} limit
   * @returns {object} - { data: [], meta: {} }
   */
  static paginateArray(
    items = [],
    page = appConfig.pagination.defaultPage,
    limit = appConfig.pagination.defaultLimit
  ) {
    const { skip, limit: safeLimit, page: currentPage } = this.getPagination(page, limit);
    const paginatedData = items.slice(skip, skip + safeLimit);
    const meta = this.getMeta(items.length, currentPage, safeLimit);
    return { data: paginatedData, meta };
  }

  /**
   * Generate pagination object for MongoDB / SQL queries
   * @param {object} options - { page, limit }
   * @returns {object} - { skip, limit }
   */
  static paginateQuery({
    page = appConfig.pagination.defaultPage,
    limit = appConfig.pagination.defaultLimit,
  } = {}) {
    return this.getPagination(page, limit);
  }
}
