import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  PAGINATION_DEFAULTS,
  parsePaginationParams,
  createPaginatedResponse,
  applyPagination,
  executePaginatedQuery,
  executeCursorQuery,
  paginationMiddleware,
  infiniteScrollResponse
} from '../pagination.js';

describe('Pagination Utility', () => {
  describe('PAGINATION_DEFAULTS', () => {
    it('should have correct default values', () => {
      expect(PAGINATION_DEFAULTS.page).toBe(1);
      expect(PAGINATION_DEFAULTS.limit).toBe(20);
      expect(PAGINATION_DEFAULTS.maxLimit).toBe(100);
      expect(PAGINATION_DEFAULTS.defaultSort).toEqual({ createdAt: -1 });
    });
  });

  describe('parsePaginationParams', () => {
    it('should use defaults when no query params provided', () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
      expect(result.sort).toEqual({ createdAt: -1 });
    });

    it('should parse page number correctly', () => {
      const result = parsePaginationParams({ page: '3' });
      expect(result.page).toBe(3);
      expect(result.skip).toBe(40); // (3-1) * 20
    });

    it('should parse limit correctly', () => {
      const result = parsePaginationParams({ limit: '50' });
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(0);
    });

    it('should enforce minimum page of 1', () => {
      const result = parsePaginationParams({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('should enforce minimum page of 1 for negative values', () => {
      const result = parsePaginationParams({ page: '-5' });
      expect(result.page).toBe(1);
    });

    it('should enforce minimum limit of 1', () => {
      const result = parsePaginationParams({ limit: '0' });
      expect(result.limit).toBe(20); // defaults to default limit
    });

    it('should enforce max limit', () => {
      const result = parsePaginationParams({ limit: '200' });
      expect(result.limit).toBe(100); // maxLimit
    });

    it('should calculate skip correctly', () => {
      const result = parsePaginationParams({ page: '5', limit: '10' });
      expect(result.skip).toBe(40); // (5-1) * 10
    });

    it('should parse sortBy and sortOrder', () => {
      const result = parsePaginationParams({ sortBy: 'name', sortOrder: 'asc' });
      expect(result.sort).toEqual({ name: 1 });
    });

    it('should default to descending order when sortOrder not provided', () => {
      const result = parsePaginationParams({ sortBy: 'name' });
      expect(result.sort).toEqual({ name: -1 });
    });

    it('should use custom options', () => {
      const result = parsePaginationParams({}, { limit: 50, maxLimit: 200 });
      expect(result.limit).toBe(50);
    });

    it('should handle invalid page as default', () => {
      const result = parsePaginationParams({ page: 'invalid' });
      expect(result.page).toBe(1);
    });

    it('should handle invalid limit as default', () => {
      const result = parsePaginationParams({ limit: 'invalid' });
      expect(result.limit).toBe(20);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create correct paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const total = 50;
      const pagination = { page: 2, limit: 20 };
      const result = createPaginatedResponse(data, total, pagination);

      expect(result.data).toEqual(data);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(3); // Math.ceil(50/20)
      expect(result.pagination.totalItems).toBe(50);
      expect(result.pagination.itemsPerPage).toBe(20);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
      expect(result.pagination.nextPage).toBe(3);
      expect(result.pagination.prevPage).toBe(1);
    });

    it('should handle first page correctly', () => {
      const data = [{ id: 1 }];
      const total = 10;
      const pagination = { page: 1, limit: 20 };
      const result = createPaginatedResponse(data, total, pagination);

      expect(result.pagination.hasPrevPage).toBe(false);
      expect(result.pagination.prevPage).toBe(null);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.nextPage).toBe(null);
    });

    it('should handle last page correctly', () => {
      const data = [{ id: 1 }];
      const total = 50;
      const pagination = { page: 3, limit: 20 };
      const result = createPaginatedResponse(data, total, pagination);

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.nextPage).toBe(null);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should handle empty data', () => {
      const data = [];
      const total = 0;
      const pagination = { page: 1, limit: 20 };
      const result = createPaginatedResponse(data, total, pagination);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });

  describe('applyPagination', () => {
    it('should apply skip, limit, and sort to query', () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      };

      const pagination = { skip: 20, limit: 10, sort: { name: 1 } };
      const result = applyPagination(mockQuery, pagination);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toBe(mockQuery);
    });
  });

  describe('executePaginatedQuery', () => {
    let mockModel;

    beforeEach(() => {
      mockModel = {
        find: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn(),
        countDocuments: jest.fn()
      };
    });

    it('should execute paginated query with defaults', async () => {
      const filter = { status: 'active' };
      const pagination = { skip: 0, limit: 20, sort: { createdAt: -1 } };
      const data = [{ id: 1 }, { id: 2 }];
      const total = 50;

      const mockQuery = {
        lean: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(data)
      };

      mockModel.find.mockReturnValue(mockQuery);
      mockModel.countDocuments.mockResolvedValue(total);

      const result = await executePaginatedQuery(mockModel, filter, pagination);

      expect(mockModel.find).toHaveBeenCalledWith(filter);
      expect(mockQuery.lean).toHaveBeenCalled();
      expect(result.data).toEqual(data);
      expect(result.pagination.totalItems).toBe(total);
    });

    it('should apply select option', async () => {
      const filter = {};
      const pagination = { skip: 0, limit: 20, sort: {} };
      const options = { select: 'name email' };

      const mockSelect = jest.fn().mockReturnThis();
      const mockQuery = {
        select: mockSelect,
        lean: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      mockModel.find.mockReturnValue(mockQuery);
      mockModel.countDocuments.mockResolvedValue(0);

      await executePaginatedQuery(mockModel, filter, pagination, options);

      expect(mockSelect).toHaveBeenCalledWith('name email');
    });

    it('should apply populate option', async () => {
      const filter = {};
      const pagination = { skip: 0, limit: 20, sort: {} };
      const options = { populate: 'user' };

      const mockPopulate = jest.fn().mockReturnThis();
      const mockQuery = {
        populate: mockPopulate,
        lean: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      mockModel.find.mockReturnValue(mockQuery);
      mockModel.countDocuments.mockResolvedValue(0);

      await executePaginatedQuery(mockModel, filter, pagination, options);

      expect(mockPopulate).toHaveBeenCalledWith('user');
    });

    it('should respect lean option', async () => {
      const filter = {};
      const pagination = { skip: 0, limit: 20, sort: {} };
      const options = { lean: false };

      const mockLean = jest.fn().mockReturnThis();
      const mockQuery = {
        lean: mockLean,
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      mockModel.find.mockReturnValue(mockQuery);
      mockModel.countDocuments.mockResolvedValue(0);

      await executePaginatedQuery(mockModel, filter, pagination, options);

      // When lean is false, lean() should not be called
      expect(mockLean).not.toHaveBeenCalled();
    });
  });

  describe('executeCursorQuery', () => {
    let mockModel;

    beforeEach(() => {
      mockModel = {
        find: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn()
      };
    });

    it('should execute cursor query without cursor', async () => {
      const filter = {};
      const data = [{ _id: '1' }, { _id: '2' }];

      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(data)
      });

      const result = await executeCursorQuery(mockModel, filter);

      expect(result.data).toEqual(data);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBe(null);
    });

    it('should handle cursor with descending sort', async () => {
      const filter = {};
      const options = { cursor: 'cursor123', sortField: '_id', sortOrder: -1 };
      const data = [{ _id: '1' }, { _id: '2' }];

      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(data)
      });

      await executeCursorQuery(mockModel, filter, options);

      expect(mockModel.find).toHaveBeenCalledWith({
        _id: { $lt: 'cursor123' }
      });
    });

    it('should handle cursor with ascending sort', async () => {
      const filter = {};
      const options = { cursor: 'cursor123', sortField: '_id', sortOrder: 1 };
      const data = [{ _id: '1' }];

      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(data)
      });

      await executeCursorQuery(mockModel, filter, options);

      expect(mockModel.find).toHaveBeenCalledWith({
        _id: { $gt: 'cursor123' }
      });
    });

    it('should detect hasMore when data exceeds limit', async () => {
      const filter = {};
      const options = { limit: 2 };
      const data = [{ _id: '1' }, { _id: '2' }, { _id: '3' }]; // 3 items, limit 2

      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(data)
      });

      const result = await executeCursorQuery(mockModel, filter, options);

      expect(result.pagination.hasMore).toBe(true);
      expect(result.data.length).toBe(2); // Should be sliced to limit
      expect(result.pagination.nextCursor).toBe('2');
    });
  });

  describe('paginationMiddleware', () => {
    it('should add pagination to request object', () => {
      const middleware = paginationMiddleware();
      const req = { query: { page: '2', limit: '10' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.pagination).toBeDefined();
      expect(req.pagination.page).toBe(2);
      expect(req.pagination.limit).toBe(10);
      expect(next).toHaveBeenCalled();
    });

    it('should use custom options in middleware', () => {
      const middleware = paginationMiddleware({ limit: 50 });
      const req = { query: {} };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.pagination.limit).toBe(50);
    });
  });

  describe('infiniteScrollResponse', () => {
    it('should create infinite scroll response with hasMore', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const cursor = 'cursor123';
      const hasMore = true;

      const result = infiniteScrollResponse(data, cursor, hasMore);

      expect(result.items).toEqual(data);
      expect(result.nextCursor).toBe(cursor);
      expect(result.hasMore).toBe(true);
    });

    it('should create infinite scroll response without hasMore', () => {
      const data = [{ id: 1 }];
      const cursor = 'cursor123';
      const hasMore = false;

      const result = infiniteScrollResponse(data, cursor, hasMore);

      expect(result.items).toEqual(data);
      expect(result.nextCursor).toBe(null);
      expect(result.hasMore).toBe(false);
    });
  });
});

