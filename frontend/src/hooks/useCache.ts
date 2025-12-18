import { useState, useEffect, useMemo, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0'; // versioning for cache invalidation

export function usePersistedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number = 2 * 60 * 1000 // 2 min
) {

  const stableFetcher = useCallback(fetcher, []);
  // sync check cache on init
  const initialData = useMemo(() => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed: CacheEntry<T> = JSON.parse(cached);
        
        // Check version and expiry
        if (parsed.version === CACHE_VERSION && 
            Date.now() - parsed.timestamp < duration) {
          console.log(`🎯 Using localStorage cache for ${key}`);
          return {
            data: parsed.data,
            fromCache: true
          };
        }
      }
    } catch (error) {
      console.warn('Cache parse error:', error);
      localStorage.removeItem(key); // clear invalid cache
    }
    
    return {
      data: null,
      fromCache: false
    };
  }, [key, duration]);

  const [data, setData] = useState<T | null>(initialData.data);
  const [loading, setLoading] = useState(!initialData.fromCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // if data is from cache, no need to fetch again
    if (initialData.fromCache) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await stableFetcher();
        
        // Store in localStorage
        const cacheEntry: CacheEntry<T> = {
          data: result,
          timestamp: Date.now(),
          version: CACHE_VERSION
        };
        
        try {
          localStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError);
        }
        
        setData(result);
      } catch (err) {
        setError(err as Error);
        
        // try to use stale cache on error
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CacheEntry<T> = JSON.parse(cached);
            console.log(`⚠️ Using stale cache for ${key} due to error`);
            setData(parsed.data);
          }
        } catch {
          // ignore parsing errors
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, stableFetcher, initialData.fromCache]);

  const invalidateCache = () => {
    localStorage.removeItem(key);
    setData(null);
    setLoading(true);
    setError(null);
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      
      const cacheEntry: CacheEntry<T> = {
        data: result,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      
      localStorage.setItem(key, JSON.stringify(cacheEntry));
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    invalidateCache, 
    refreshData,
    fromCache: initialData.fromCache 
  };
}

// export a simple version of memory cache Hook
export function useMemoryCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number = 2 * 60 * 1000
) {
  const [cache] = useState(() => new Map<string, CacheEntry<T>>());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // check cache first
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < duration) {
        console.log(`🎯 Using memory cache for ${key}`);
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetcher();
        
        // store in memory cache
        cache.set(key, {
          data: result,
          timestamp: Date.now(),
          version: CACHE_VERSION
        });
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, fetcher, duration, cache]);

  const clearCache = () => {
    cache.delete(key);
  };

  return { data, loading, error, clearCache };
}