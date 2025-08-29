import axios from 'axios';
import { GitHubRepo } from '../types';

export const fetchTrendingRepos = async (): Promise<GitHubRepo[]> => {
  try {
    const dateQuery = getDateString(7); // 7 days ago
    const query = `created:>${dateQuery}`;

    const response = await axios.get('https://api.github.com/search/repositories', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 100
      }
    });

    return response.data.items;
  } catch (error) {
    console.error('GitHub API error:', error);
    throw new Error('Failed to fetch trending repositories');
  }
};

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}