import axios from 'axios';
import { logger } from '../middleware/errorHandler';
import { GitHubRepo } from '../types'; //

class GitHubService {
  private baseURL: string;
  private token: string | undefined;
  private cache: Map<string, any>;
  private rateLimitRemaining: number;

  constructor() {
    this.baseURL = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN;
    this.cache = new Map();
    this.rateLimitRemaining = 5000;
  }

  async fetchTrendingRepos(language: string = '', timeRange: string = '7d'): Promise<GitHubRepo[]> {
    const cacheKey = `trending-${language}-${timeRange}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      logger.info(`Cache hit for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    try {
      const dateQuery = this.getDateQuery(timeRange);
      const query = language 
        ? `language:${language} created:>${dateQuery}`
        : `created:>${dateQuery}`;

      const response = await axios.get(`${this.baseURL}/search/repositories`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 100
        }
      });

      // Update rate limit information
      this.rateLimitRemaining = response.headers['x-ratelimit-remaining'];
      
      const processedData = this.processRepositoryData(response.data.items);

      // Cache result (5 minutes)
      this.cache.set(cacheKey, processedData);
      setTimeout(() => this.cache.delete(cacheKey), 300000);

      logger.info(`Fetched ${processedData.length} repositories for ${language || 'all languages'}`);
      return processedData;

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('GitHub API fetch error:', errorObj.message);
      throw new Error(`Failed to fetch data from GitHub: ${errorObj.message}`);
    }
  }

  processRepositoryData(repos: GitHubRepo[]): any[] { 
    return repos.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      description: repo.description,
      url: repo.html_url,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      trendingScore: this.calculateTrendingScore(repo)
    }));
  }

  calculateTrendingScore(repo: GitHubRepo): number {
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const daysSinceCreated = this.getDaysSince(repo.created_at);
    const daysSinceUpdated = this.getDaysSince(repo.updated_at);

    // Simple trending score algorithm
    const starScore = Math.log(stars + 1) * 10;
    const forkScore = Math.log(forks + 1) * 5;
    const freshnessScore = Math.max(0, 100 - daysSinceUpdated);
    const ageBonus = Math.max(0, 50 - daysSinceCreated);

    return Math.round(starScore + forkScore + freshnessScore + ageBonus);
  }

  getDateQuery(timeRange: string): string {
    const now = new Date();
    const days = { '1d': 1, '7d': 7, '30d': 30 }[timeRange] || 7;
    const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      cacheSize: this.cache.size
    };
  }
}

export default new GitHubService();