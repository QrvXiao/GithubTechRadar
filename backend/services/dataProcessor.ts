import { GitHubRepo, PlotlyData } from '../types';
import cacheService from './cacheService';

interface LanguageStats {
  totalStars: number;
  totalForks: number;
  repositoryCount: number;
  repositories: GitHubRepo[];
}

export const transformToPlotlyData = (repos: GitHubRepo[]): PlotlyData[] => {
  // Create cache key (hash based on data content)
  const dataHash = repos.map(r => `${r.id}-${r.stargazers_count}`).join('').slice(0, 50);
  const cacheKey = `plotly-${dataHash}`;

  const cached = cacheService.get(cacheKey);
  if (cached) {
    console.log('🎯 Using cached plotly data');
    return cached;
  }

  const cleanRepos = repos.filter(repo => 
    repo.language && typeof repo.stargazers_count === 'number'
  );

  const r = cleanRepos.map(repo => repo.stargazers_count);
  const theta = cleanRepos.map(repo => repo.language!);
  const text = cleanRepos.map(repo => 
    `<b>${repo.name}</b><br>${repo.description ? 
      repo.description.replace(/[\r\n]+/g, ' ') : 'No description'}`
  );
  const customdata = cleanRepos.map(repo => repo.html_url);

  const result: PlotlyData[] = [{
    type: 'scatterpolar',
    mode: 'markers',
    r,
    theta,
    text,
    customdata,
    hoverinfo: 'text',
    marker: { size: 8 },
    name: 'Trending Repos',
  }];

  // Cache for 30 minutes
  cacheService.set(cacheKey, result, 30);
  return result;
};

export const aggregateLanguageData = (repos: GitHubRepo[]) => {
  // Create cache key
  const dataHash = repos.map(r => r.id).join('-').slice(0, 50);
  const cacheKey = `aggregate-${dataHash}`;

  const cached = cacheService.get(cacheKey);
  if (cached) {
    console.log('🎯 Using cached aggregate data');
    return cached;
  }

  const languageStats = new Map<string, LanguageStats>();

  repos.forEach(repo => {
    if (!repo.language) return;
    
    const stats = languageStats.get(repo.language) || {
      totalStars: 0,
      totalForks: 0,
      repositoryCount: 0,
      repositories: []
    };

    stats.totalStars += repo.stargazers_count;
    stats.totalForks += repo.forks_count;
    stats.repositoryCount += 1;
    stats.repositories.push(repo);

    languageStats.set(repo.language, stats);
  });

  const result = Array.from(languageStats.entries()).map(([language, stats]) => ({
    language,
    ...stats,
    trendingScore: calculateTrendingScore(stats),
    topRepositories: stats.repositories
      .sort((a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
  }));

  // Cache for 30 minutes
  cacheService.set(cacheKey, result, 30);
  return result;
};

function calculateTrendingScore(stats: LanguageStats): number {
  const starScore = Math.log(stats.totalStars + 1) * 10;
  const repoScore = stats.repositoryCount * 5;
  return Math.round(starScore + repoScore);
}

// Export cache control function
export const clearProcessorCache = () => {
  const keys = cacheService.keys().filter(key => 
    key.startsWith('plotly-') || key.startsWith('aggregate-')
  );
  keys.forEach(key => cacheService.delete(key));
  console.log(`Cleared ${keys.length} processor cache entries`);
};