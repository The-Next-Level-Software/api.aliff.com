import appConfig from "../config/index.js";

class SearchService {
  /**
   * Build a search query dynamically
   */
  static buildSearchQuery(searchFields, term) {
    if (!term || !searchFields) return {};

    const query = { $or: [] };

    for (const [field, type] of Object.entries(searchFields)) {
      switch (type) {
        case "string":
          query.$or.push({ [field]: { $regex: term, $options: "i" } });
          break;

        case "number":
          const num = Number(term);
          if (!isNaN(num)) query.$or.push({ [field]: num });
          break;

        case "boolean":
          if (["true", "false"].includes(term.toLowerCase())) {
            query.$or.push({ [field]: term.toLowerCase() === "true" });
          }
          break;

        default:
          query.$or.push({ [field]: term });
      }
    }

    return query.$or.length ? query : {};
  }

  /**
   * Pagination
   */
  static async paginate(query, page, limit) {
    const skip = (page - 1) * limit;

    const [total, results] = await Promise.all([
      query.model.countDocuments(query.getQuery()),
      query.skip(skip).limit(limit),
    ]);

    return {
      results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Sorting
   */
  static applySorting(query, sortBy = "createdAt", order = "desc") {
    const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;
    return query.sort({ [sortBy]: sortOrder });
  }

  /**
   * Field selection
   */
  static applySelect(query, fields = []) {
    if (!fields.length) return query;
    return query.select(fields.join(" "));
  }

  /**
   * Generic search method
   */
  static async search(model, options = {}) {
    const {
      searchFields = null,
      term = "",
      page = appConfig.pagination.defaultPage,
      limit = appConfig.pagination.defaultLimit,
      sortBy = "createdAt",
      order = "desc",
      selectFields = [],
    } = options;

    const searchQuery = this.buildSearchQuery(searchFields, term);

    let query = model.find(searchQuery);

    query = this.applySorting(query, sortBy, order);
    query = this.applySelect(query, selectFields);

    return await this.paginate(query, page, limit);
  }

  /**
   * 🔥 NEW: Extract everything from req.query for boilerplate APIs
   */
  static async handleRequest(model, req, { searchFields = {} } = {}) {
    const { term = "", page, limit, sortBy = "createdAt", order = "desc", fields } = req.query;

    return await this.search(model, {
      searchFields,
      term,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      order,
      selectFields: fields ? fields.split(",") : [],
    });
  }
}

export const searchService = SearchService;
