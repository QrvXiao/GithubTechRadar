import express, { Request, Response } from 'express';
import { fetchTrendingRepos } from '../services/github';
import { GitHubRepo, PlotlyData } from '../types';

const router = express.Router();

router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const repos: GitHubRepo[] = await fetchTrendingRepos();

    // clean and filter repos
    const cleanRepos = repos
      .filter((repo: GitHubRepo) => repo.language && typeof repo.stargazers_count === 'number');

    // Transform for Plotly
    const r: number[] = cleanRepos.map((repo: GitHubRepo) => repo.stargazers_count);
    const theta: string[] = cleanRepos.map((repo: GitHubRepo) => repo.language!);
    const text: string[] = cleanRepos.map(
      (repo: GitHubRepo) => `<b>${repo.name}</b><br>${repo.description ? repo.description.replace(/[\r\n]+/g, ' ') : 'No description'}`
    );
    const customdata: string[] = cleanRepos.map((repo: GitHubRepo) => repo.html_url);

    const plotData: PlotlyData[] = [
      {
        type: 'scatterpolar',
        mode: 'markers',
        r,
        theta,
        text,
        customdata,
        hoverinfo: 'text',
        marker: { size: 8 },
        name: 'Trending Repos',
      },
    ];

    res.json(plotData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;