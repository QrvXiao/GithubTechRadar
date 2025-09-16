interface CacheEntry {
  data: any;
  expiry: number;
  hits: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // max 1000 entries

  set(key: string, data: any, ttlMinutes: number = 5): void {
    // if cache is full, remove expired entries
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(key, { 
      data, 
      expiry, 
      hits: 0 
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    // record hit count
    cached.hits++;
    return cached.data;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // obtain cache statistics
  getStats() {
    const total = this.cache.size;
    const expired = Array.from(this.cache.values())
      .filter(entry => Date.now() > entry.expiry).length;
    
    return {
      total,
      active: total - expired,
      expired,
      maxSize: this.maxSize
    };
  }

  // obtain all cache keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export default new CacheService();