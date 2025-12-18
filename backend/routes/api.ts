import express, { Request, Response } from 'express';
import { fetchTrendingRepos } from '../services/github';
import { GitHubRepo, PlotlyData } from '../types';
import githubService from '../services/githubService';
import { transformToPlotlyData } from '../services/dataProcessor';
import cacheService from '../services/cacheService';
import RepoData from '../models/RepoData';

const router = express.Router();

router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, timeRange = '7d', limit = '100' } = req.query;
    
    const limitNum = parseInt(limit as string) || 100;
    const timeRangeStr = timeRange as string;
    
    // Try to get repo data from MongoDB first
    const filter: any = { timeRange: timeRangeStr };
    if (language && language !== 'all') {
      filter.language = language;
    }

    let repos = await RepoData.find(filter)
      .sort({ stars: -1 })
      .limit(limitNum)
      .lean();

    let dataSource = 'cache';
    let fromMongo = true;

    // If no cached data, fetch from GitHub API
    if (repos.length === 0) {
      console.log('📡 No cached data, fetching from GitHub API...');
      dataSource = 'live';
      fromMongo = false;
      
      const githubRepos: GitHubRepo[] = await githubService.fetchTrendingRepos(language as string || '', timeRangeStr);
      
      // Convert GitHub data to our format
      const repoData = githubRepos
        .filter(repo => repo.language && typeof repo.stargazers_count === 'number')
        .slice(0, limitNum)
        .map(repo => ({
          repoId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language!,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
          lastFetched: new Date(),
          timeRange: timeRangeStr as '1d' | '7d' | '30d'
        }));
      
      repos = repoData as any; // temporary type conversion
    }

    // Convert to Plotly format - one data point per repo
    const r: number[] = repos.map(repo => repo.stars);
    const theta: string[] = repos.map(repo => repo.language);
    const text: string[] = repos.map(repo => 
      `<b>${repo.name}</b><br>${repo.description || 'No description'}<br>⭐ ${repo.stars} stars`
    );
    const customdata: string[] = repos.map(repo => repo.url);

    const plotData: PlotlyData[] = [{
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

    console.log(`📊 Returning ${repos.length} repo data points (source: ${dataSource})`);
    res.json(plotData);
  } catch (error) {
    console.error('Trending API error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;