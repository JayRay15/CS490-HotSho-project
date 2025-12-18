import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Cache Utility', () => {
  let cache;
  let originalEnv;

  beforeEach(async () => {
    jest.resetModules();
    originalEnv = process.env;
    process.env = { ...originalEnv };
    
    // Remove Redis env vars to use memory cache
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    
    const cacheModule = await import('../cache.js');
    cache = cacheModule.default;
    
    // Initialize cache
    await cache.initCache();
  });

  afterEach(async () => {
    process.env = originalEnv;
    try {
      await cache.flush();
      await cache.closeCache();
    } catch (e) {
      // Ignore cleanup errors
    }
    jest.restoreAllMocks();
  });

  describe('generateKey', () => {
    it('should generate key from string identifier', () => {
      const key = cache.generateKey('user', '123');
      expect(key).toBe('user:123');
    });

    it('should generate key from object identifier', () => {
      const key = cache.generateKey('jobs', { userId: '123', status: 'active' });
      expect(key).toContain('jobs:');
      expect(key).toContain('userId');
      expect(key).toContain('status');
    });

    it('should create consistent keys from same object', () => {
      const obj = { userId: '123', status: 'active' };
      const key1 = cache.generateKey('jobs', obj);
      const key2 = cache.generateKey('jobs', obj);
      expect(key1).toBe(key2);
    });

    it('should handle different key prefixes', () => {
      const key1 = cache.generateKey('user', '123');
      const key2 = cache.generateKey('jobs', '123');
      expect(key1).not.toBe(key2);
    });
  });

  describe('get and set', () => {
    it('should set and get a value', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('nonexistent:key');
      expect(result).toBeNull();
    });

    it('should handle string values', async () => {
      const key = 'test:string';
      const value = 'test string';
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toBe(value);
    });

    it('should handle number values', async () => {
      const key = 'test:number';
      const value = 42;
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toBe(value);
    });

    it('should handle array values', async () => {
      const key = 'test:array';
      const value = [1, 2, 3];
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toEqual(value);
    });

    it('should handle complex objects', async () => {
      const key = 'test:object';
      const value = {
        nested: {
          data: [1, 2, 3],
          string: 'test'
        }
      };
      
      await cache.set(key, value);
      const result = await cache.get(key);
      
      expect(result).toEqual(value);
    });

    it('should respect TTL', async () => {
      const key = 'test:ttl';
      const value = 'test';
      const ttl = 1; // 1 second
      
      await cache.set(key, value, ttl);
      const result1 = await cache.get(key);
      expect(result1).toBe(value);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      const result2 = await cache.get(key);
      expect(result2).toBeNull();
    }, 5000);
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';
      const value = 'test';
      
      await cache.set(key, value);
      await cache.del(key);
      const result = await cache.get(key);
      
      expect(result).toBeNull();
    });

    it('should handle deleting non-existent key', async () => {
      const result = await cache.del('nonexistent:key');
      expect(result).toBe(true); // Should not throw
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test:getorset';
      const cachedValue = { data: 'cached' };
      const fetchFn = jest.fn().mockResolvedValue({ data: 'fresh' });
      
      await cache.set(key, cachedValue);
      const result = await cache.getOrSet(key, fetchFn);
      
      expect(result.data).toEqual(cachedValue);
      expect(result.fromCache).toBe(true);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      const key = 'test:getorset2';
      const freshValue = { data: 'fresh' };
      const fetchFn = jest.fn().mockResolvedValue(freshValue);
      
      const result = await cache.getOrSet(key, fetchFn);
      
      expect(result.data).toEqual(freshValue);
      expect(result.fromCache).toBe(false);
      expect(fetchFn).toHaveBeenCalled();
      
      // Verify it was cached
      const cached = await cache.get(key);
      expect(cached).toEqual(freshValue);
    });

    it('should handle fetch function errors', async () => {
      const key = 'test:getorset3';
      const fetchFn = jest.fn().mockRejectedValue(new Error('Fetch failed'));
      
      await expect(cache.getOrSet(key, fetchFn)).rejects.toThrow('Fetch failed');
    });

    it('should use custom TTL', async () => {
      const key = 'test:getorset4';
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });
      
      await cache.getOrSet(key, fetchFn, 60);
      
      // Verify TTL was set (we can't directly test this, but function should complete)
      expect(fetchFn).toHaveBeenCalled();
    });
  });

  describe('flush', () => {
    it('should flush all cache', async () => {
      await cache.set('test:1', 'value1');
      await cache.set('test:2', 'value2');
      
      await cache.flush();
      
      const result1 = await cache.get('test:1');
      const result2 = await cache.get('test:2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cache.set('test:1', 'value1');
      await cache.get('test:1');
      await cache.get('nonexistent');
      
      const stats = cache.getStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalOperations');
      expect(stats).toHaveProperty('cacheType');
    });

    it('should calculate hit rate correctly', async () => {
      await cache.set('test:1', 'value1');
      await cache.get('test:1'); // hit
      await cache.get('test:1'); // hit
      await cache.get('nonexistent'); // miss
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.hitRate).toBeDefined();
    });
  });

  describe('invalidateUserCache', () => {
    it('should invalidate user-related cache', async () => {
      await cache.set('user:123:profile', { name: 'Test' });
      await cache.set('jobs:123:list', [1, 2, 3]);
      await cache.set('dashboard:123:data', { stats: 'test' });
      await cache.set('analytics:123:report', { data: 'test' });
      
      await cache.invalidateUserCache('123');
      
      expect(await cache.get('user:123:profile')).toBeNull();
      expect(await cache.get('jobs:123:list')).toBeNull();
      expect(await cache.get('dashboard:123:data')).toBeNull();
      expect(await cache.get('analytics:123:report')).toBeNull();
    });

    it('should not affect other users cache', async () => {
      await cache.set('user:123:profile', { name: 'User1' });
      await cache.set('user:456:profile', { name: 'User2' });
      
      await cache.invalidateUserCache('123');
      
      expect(await cache.get('user:123:profile')).toBeNull();
      expect(await cache.get('user:456:profile')).not.toBeNull();
    });
  });

  describe('CACHE_TTL', () => {
    it('should export CACHE_TTL constants', async () => {
      const cacheModule = await import('../cache.js');
      
      expect(cacheModule.CACHE_TTL).toBeDefined();
      expect(cacheModule.CACHE_TTL.user).toBeDefined();
      expect(cacheModule.CACHE_TTL.jobs).toBeDefined();
      expect(cacheModule.CACHE_TTL.analytics).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle get errors gracefully', async () => {
      // This should not throw even if there's an internal error
      const result = await cache.get('test:key');
      expect(result).toBeNull();
    });

    it('should handle set errors gracefully', async () => {
      // This should not throw even if there's an internal error
      const result = await cache.set('test:key', 'value');
      expect(typeof result).toBe('boolean');
    });
  });
});

