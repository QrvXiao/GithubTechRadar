import express from 'express';
import { GitHubRepo, PlotlyData, ApiResponse } from '../types';
import { validateQuery, validateRadarData } from '../middleware/validation';
import { handleErrors } from '../middleware/errorHandler';
import githubService from '../services/githubService';
import TechRadar from '../models/TechRadar';

const router = express.Router();

// GET /api/radar-data
router.get('/radar-data', validateQuery, async (req, res) => {
  try {
    const { language, timeRange, limit } = req.query;
    
    const filter = {};
    if (language) {
      filter.language = { $in: language.split(',') };
    }
    filter.timeRange = timeRange;

    const data = await TechRadar.find(filter)
      .sort({ trendingScore: -1 })
      .limit(parseInt(limit))
      .lean();

    // If no data found, fetch from GitHub
    if (data.length === 0) {
      const githubData = await githubService.fetchTrendingRepos(language, timeRange);
      // Process and store the data...
    }

    res.json({ 
      success: true, 
      data, 
      count: data.length,
      timeRange,
      rateLimitStatus: githubService.getRateLimitStatus()
    });
  } catch (error) {
    handleErrors(error, res);
  }
});

// POST /api/radar-data/refresh
router.post('/radar-data/refresh', async (req, res) => {
  try {
    const { language, timeRange = '7d' } = req.body;
    
    const freshData = await githubService.fetchTrendingRepos(language, timeRange);

    // Save to database logic...

    res.json({
      success: true,
      message: 'Data refreshed successfully',
      count: freshData.length
    });
  } catch (error) {
    handleErrors(error, res);
  }
});


export default router;