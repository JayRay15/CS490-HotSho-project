/**
 * Pagination Utility
 * 
 * Provides consistent pagination across all API endpoints
 * Supports both offset-based and cursor-based pagination
 */

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  defaultSort: { createdAt: -1 }
};

/**
 * Parse pagination parameters from request query
 * 
 * @param {object} query - Request query object
 * @param {object} options - Custom options
 * @returns {object} Parsed pagination parameters
 */
export const parsePaginationParams = (query, options = {}) => {
  const defaults = { ...PAGINATION_DEFAULTS, ...options };
  
  // Parse page number
  let page = parseInt(query.page) || defaults.page;
  if (page < 1) page = 1;
  
  // Parse limit
  let limit = parseInt(query.limit) || defaults.limit;
  if (limit < 1) limit = defaults.limit;
  if (limit > defaults.maxLimit) limit = defaults.maxLimit;
  
  // Calculate skip
  const skip = (page - 1) * limit;
  
  // Parse sort
  let sort = defaults.defaultSort;
  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 1 : -1;
    sort = { [query.sortBy]: order };
  }
  
  return {
    page,
    limit,
    skip,
    sort
  };
};

/**
 * Create paginated response
 * 
 * @param {array} data - Array of documents
 * @param {number} total - Total number of documents
 * @param {object} pagination - Pagination parameters
 * @returns {object} Paginated response object
 */
export const createPaginatedResponse = (data, total, pagination) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

/**
 * Apply pagination to a Mongoose query
 * 
 * @param {Query} query - Mongoose query object
 * @param {object} pagination - Pagination parameters from parsePaginationParams
 * @returns {Query} Modified query with pagination applied
 */
export const applyPagination = (query, pagination) => {
  const { skip, limit, sort } = pagination;
  return query.skip(skip).limit(limit).sort(sort);
};

/**
 * Execute a paginated query
 * 
 * @param {Model} model - Mongoose model
 * @param {object} filter - Query filter
 * @param {object} pagination - Pagination parameters
 * @param {object} options - Additional options (select, populate, lean)
 * @returns {Promise<object>} Paginated response
 */
export const executePaginatedQuery = async (model, filter, pagination, options = {}) => {
  const { skip, limit, sort } = pagination;
  const { select, populate, lean = true } = options;
  
  // Build query
  let query = model.find(filter);
  
  if (select) {
    query = query.select(select);
  }
  
  if (populate) {
    query = query.populate(populate);
  }
  
  if (lean) {
    query = query.lean();
  }
  
  // Execute queries in parallel
  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit).sort(sort),
    model.countDocuments(filter)
  ]);
  
  return createPaginatedResponse(data, total, pagination);
};

/**
 * Cursor-based pagination for large datasets
 * More efficient for large collections as it doesn't require skip
 * 
 * @param {Model} model - Mongoose model
 * @param {object} filter - Query filter
 * @param {object} options - Cursor options (cursor, limit, sortField, sortOrder)
 * @returns {Promise<object>} Cursor-paginated response
 */
export const executeCursorQuery = async (model, filter, options = {}) => {
  const {
    cursor,
    limit = PAGINATION_DEFAULTS.limit,
    sortField = '_id',
    sortOrder = -1, // -1 for descending (newest first)
    select,
    populate,
    lean = true
  } = options;
  
  // Build filter with cursor
  const cursorFilter = { ...filter };
  if (cursor) {
    const operator = sortOrder === -1 ? '$lt' : '$gt';
    cursorFilter[sortField] = { [operator]: cursor };
  }
  
  // Build query
  let query = model.find(cursorFilter);
  
  if (select) {
    query = query.select(select);
  }
  
  if (populate) {
    query = query.populate(populate);
  }
  
  if (lean) {
    query = query.lean();
  }
  
  // Fetch one extra to check if there's more
  const data = await query
    .sort({ [sortField]: sortOrder })
    .limit(limit + 1);
  
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = items.length > 0 ? items[items.length - 1][sortField] : null;
  
  return {
    data: items,
    pagination: {
      hasMore,
      nextCursor: hasMore ? nextCursor : null,
      count: items.length,
      limit
    }
  };
};

/**
 * Pagination middleware
 * Parses pagination params and adds to request
 * 
 * @param {object} options - Custom pagination options
 */
export const paginationMiddleware = (options = {}) => {
  return (req, res, next) => {
    req.pagination = parsePaginationParams(req.query, options);
    next();
  };
};

/**
 * Infinite scroll pagination helper
 * Returns data formatted for infinite scroll implementations
 * 
 * @param {array} data - Array of documents
 * @param {string} cursor - Cursor for next page
 * @param {boolean} hasMore - Whether more data is available
 */
export const infiniteScrollResponse = (data, cursor, hasMore) => {
  return {
    items: data,
    nextCursor: hasMore ? cursor : null,
    hasMore
  };
};

export default {
  PAGINATION_DEFAULTS,
  parsePaginationParams,
  createPaginatedResponse,
  applyPagination,
  executePaginatedQuery,
  executeCursorQuery,
  paginationMiddleware,
  infiniteScrollResponse
};
