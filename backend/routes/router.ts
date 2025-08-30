import express from 'express';
import { GitHubRepo, PlotlyData, ApiResponse } from '../types';
import { validateQuery, validateRadarData } from '../middleware/validation';
import { handleErrors } from '../middleware/errorHandler';
import githubService from '../services/githubService';
import TechRadar from '../models/TechRadar';

const router = express.Router();

interface MongoFilter {
  language?: { $in: string[] };
  [key: string]: any;
}

// GET /api/radar-data
router.get('/radar-data', validateQuery, async (req, res) => {
  try {
    const { language, timeRange, limit } = req.query;
    
    const languageStr = typeof language === 'string' ? language : undefined;
    const timeRangeStr = typeof timeRange === 'string' ? timeRange : undefined;
    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 10;

    const filter: MongoFilter = {};
    if (languageStr) {
      filter.language = { $in: languageStr.split(',') };
    }
    if (timeRangeStr) {
      filter.timeRange = timeRangeStr;
    }

    const data = await TechRadar.find(filter)
      .sort({ trendingScore: -1 })
      .limit(limitNum)
      .lean();

    // If no data found, fetch from GitHub
    if (data.length === 0) {
      const githubData = await githubService.fetchTrendingRepos(languageStr, timeRangeStr);
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
     const errorObj = error instanceof Error ? error : new Error(String(error));    
    handleErrors(errorObj, res);
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
     const errorObj = error instanceof Error ? error : new Error(String(error));
    handleErrors(errorObj, res);
  }
});


export default router;