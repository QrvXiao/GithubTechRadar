const axios = require('axios');
const RepoCache = require('../models/RepoCache');
const mongoose = require('mongoose');

const fetchTrendingRepos = async () => {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  // Check for cache (within the last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let cache = await RepoCache.findOne({ fetchedAt: { $gte: oneWeekAgo } }).sort({ fetchedAt: -1 });

  if (cache) {
    return cache.items;
  }

  // Fetch from GitHub API
  const url = `https://api.github.com/search/repositories?q=created:>${getDateString(90)}&sort=stars&order=desc&per_page=100`;
  const response = await axios.get(url, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
  });

  // Save to cache
  await RepoCache.create({
    fetchedAt: new Date(),
    items: response.data.items
  });

  return response.data.items;
};

function getDateString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

module.exports = { fetchTrendingRepos };