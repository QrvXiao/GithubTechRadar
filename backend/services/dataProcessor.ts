import { GitHubRepo, PlotlyData } from '../types';

export const transformToPlotlyData = (repos: GitHubRepo[]): PlotlyData[] => {
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

  return [{
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
};

interface LanguageStats {
  totalStars: number;
  totalForks: number;
  repositoryCount: number;
  repositories: GitHubRepo[];
}


export const aggregateLanguageData = (repos: GitHubRepo[]) => {
  const languageStats = new Map();

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

  return Array.from(languageStats.entries()).map(([language, stats]) => ({
    language,
    ...stats,
    trendingScore: calculateTrendingScore(stats),
    topRepositories: stats.repositories
      .sort((a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
  }));
};

function calculateTrendingScore(stats: any): number {
  const starScore = Math.log(stats.totalStars + 1) * 10;
  const repoScore = stats.repositoryCount * 5;
  return Math.round(starScore + repoScore);
}