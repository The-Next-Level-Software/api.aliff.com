// services/queryEngine.service.js
import prisma from "../config/prisma.js";

export default class QueryEngine {
  constructor(model, query = {}, options = {}) {
    this.model = model;

    // queries from URL ?page=1&limit=10
    this.query = query;

    // custom filters from controller
    this.where = options.where || {};

    // search fields e.g. ['name','email']
    this.searchable = options.searchable || [];

    // default include relations
    this.include = options.include || {};
  }

  /**
   * Builds filters from query parameters using bracket notation:
   * ?age[gte]=20  ➝ { age: { gte: 20 } }
   */
  buildFilters() {
    let queryObj = { ...this.query };

    // Reserved params that should not be part of filtering
    const reserved = ["page", "limit", "sort", "fields", "search", "include"];
    reserved.forEach((key) => delete queryObj[key]);

    // Convert operators (gte, lte, in etc) to Prisma format
    const filters = {};
    
    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === "object" && value !== null) {
        filters[key] = {};
        for (const [op, val] of Object.entries(value)) {
          // Map MongoDB operators to Prisma operators
          const prismaOp = op; // Prisma uses same names: gte, gt, lte, lt, in, etc.
          filters[key][prismaOp] = val;
        }
      } else {
        filters[key] = value;
      }
    }

    return filters;
  }

  /**
   * Builds search conditions across multiple fields
   */
  buildSearch() {
    if (!this.query.search || this.searchable.length === 0) return {};

    const searchTerm = this.query.search;

    // Prisma uses OR with contains for search
    return {
      OR: this.searchable.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive", // case-insensitive search
        },
      })),
    };
  }

  /**
   * Executes the full pagination + filter pipeline
   */
  async exec(name = "results") {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Merge all filters
    const filters = {
      ...this.buildFilters(),
      ...this.buildSearch(),
      ...this.where,
    };

    // Build orderBy from sort parameter
    let orderBy = {};
    if (this.query.sort) {
      const sortFields = this.query.sort.split(",");
      orderBy = sortFields.map((field) => {
        if (field.startsWith("-")) {
          return { [field.substring(1)]: "desc" };
        }
        return { [field]: "asc" };
      });
    } else {
      orderBy = { createdAt: "desc" };
    }

    // Build include from query string or options
    let include = { ...this.include };
    
    if (this.query.include) {
      const includeFields = this.query.include.split(",");
      includeFields.forEach((field) => {
        include[field.trim()] = true;
      });
    }

    // Execute query with Prisma
    const queryOptions = {
      where: filters,
      skip,
      take: limit,
      orderBy,
    };

    // Only add include if there are relations to include
    if (Object.keys(include).length > 0) {
      queryOptions.include = include;
    }

    // Execute both queries in parallel
    const [results, total] = await Promise.all([
      this.model.find(queryOptions),
      this.model.count({ where: filters }),
    ]);

    return {
      [name]: results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }
}
