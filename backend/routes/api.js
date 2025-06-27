const express = require('express');
const { fetchTrendingRepos } = require('../services/github');

const router = express.Router();

router.get('/trending', async (req, res) => {
  try {
    const repos = await fetchTrendingRepos();

    // clean and filter repos
    const cleanRepos = repos
      .filter(repo => repo.language && typeof repo.stargazers_count === 'number');

    // Transform for Plotly
    const r = cleanRepos.map(repo => repo.stars || repo.stargazers_count);
    const theta = cleanRepos.map(repo => repo.language);
    // Show name and description on hover
    const text = cleanRepos.map(
      repo => `<b>${repo.name}</b><br>${repo.description ? repo.description.replace(/[\r\n]+/g, ' ') : 'No description'}`
    );
    const customdata = cleanRepos.map(repo => repo.html_url);

    const plotData = [
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

module.exports = router;