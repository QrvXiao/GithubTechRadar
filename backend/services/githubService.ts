import axios from 'axios';
import { GitHubRepo } from '../types';
import {logger} from '../utils/logger';
import cacheService from './cacheService'; // ✅ Use unified cache

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

class GitHubService {
  private readonly baseURL = 'https://api.github.com';
  private readonly headers: Record<string, string>;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor() {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'TechRadar-App'
    };

    if (process.env.GITHUB_TOKEN) {
      this.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
  }

  async fetchTrendingRepos(language: string = '', timeRange: string = '7d'): Promise<GitHubRepo[]> {
    const cacheKey = `trending-${language || 'all'}-${timeRange}`;

    // ✅ Use unified cache service
    const cached = cacheService.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      await this.checkRateLimit();

      const query = this.buildSearchQuery(language, timeRange);
      const response = await axios.get(`${this.baseURL}/search/repositories`, {
        headers: this.headers,
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 100
        }
      });

      this.updateRateLimitInfo(response.headers);

      const processedData = this.processRepositories(response.data.items);

      // ✅ Cache for 5 minutes
      cacheService.set(cacheKey, processedData, 5);
      
      logger.info(`Fetched ${processedData.length} trending repositories for ${language || 'all languages'}`);
      return processedData;

    } catch (error) {
      logger.error('Error fetching trending repositories:', error);
      
      // If API fails, try to return expired cache data
      const staleData = this.getStaleCache(cacheKey);
      if (staleData) {
        logger.warn(`Returning stale cache data for ${cacheKey}`);
        return staleData;
      }
      
      throw error;
    }
  }

  // ✅ Get expired cache data as fallback
  private getStaleCache(key: string): any | null {
    // Get directly from cache Map, even if expired
    const cache = (cacheService as any).cache;
    const entry = cache.get(key);
    return entry ? entry.data : null;
  }

  private buildSearchQuery(language: string, timeRange: string): string {
    const dateMap: Record<string, string> = {
      '1d': '1',
      '7d': '7', 
      '30d': '30'
    };
    
    const days = dateMap[timeRange] || '7';
    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));
    const dateStr = date.toISOString().split('T')[0];
    
    let query = `created:>${dateStr} stars:>10`;
    
    if (language && language !== 'all') {
      query += ` language:${language}`;
    }
    
    return query;
  }

  private processRepositories(repos: any[]): GitHubRepo[] {
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      topics: repo.topics || []
    }));
  }

  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitInfo && this.rateLimitInfo.remaining < 10) {
      const resetTime = new Date(this.rateLimitInfo.reset * 1000);
      const waitTime = resetTime.getTime() - Date.now();
      
      if (waitTime > 0) {
        logger.warn(`Rate limit approaching. Waiting ${Math.round(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  private updateRateLimitInfo(headers: any): void {
    this.rateLimitInfo = {
      limit: parseInt(headers['x-ratelimit-limit']) || 60,
      remaining: parseInt(headers['x-ratelimit-remaining']) || 60,
      reset: parseInt(headers['x-ratelimit-reset']) || Math.floor(Date.now() / 1000) + 3600
    };
  }

  getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  // ✅ Clear specific cache
  clearCache(pattern?: string): void {
    if (pattern) {
      const keys = cacheService.keys().filter(key => key.includes(pattern));
      keys.forEach(key => cacheService.delete(key));
      logger.info(`Cleared ${keys.length} cache entries matching "${pattern}"`);
    } else {
      cacheService.clear();
      logger.info('Cleared all cache');
    }
  }

  // ✅ Get cache statistics
  getCacheStats() {
    return cacheService.getStats();
  }
}

export default new GitHubService();