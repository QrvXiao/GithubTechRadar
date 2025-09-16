import express, { Request, Response } from 'express';
import { GitHubRepo, PlotlyData, ApiResponse } from '../types';
import { validateQuery } from '../middleware/validation';
import { handleErrors } from '../middleware/errorHandler';
import githubService from '../services/githubService';
import TechRadar from '../models/TechRadar';
import { transformToPlotlyData, aggregateLanguageData, clearProcessorCache } from '../services/dataProcessor';
import cacheService from '../services/cacheService';

const router = express.Router();

interface MongoFilter {
  language?: { $in: string[] };
  [key: string]: any;
}

function createError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('An unknown error occurred');
}

// GET /api/radar-data
router.get('/radar-data', validateQuery, async (req: Request, res: Response) => {
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

    let data = await TechRadar.find(filter)
      .sort({ trendingScore: -1 })
      .limit(limitNum)
      .lean();

    // If no data found, fetch from GitHub
    if (data.length === 0) {
      console.log('📡 Fetching from GitHub API...');
      const githubData = await githubService.fetchTrendingRepos(languageStr, timeRangeStr);
      
      if (githubData.length > 0) {
        const processedData = aggregateLanguageData(githubData);
        
        // 异步保存到数据库
        TechRadar.insertMany(processedData).catch(console.error);
        
        data = processedData.slice(0, limitNum);
      }
    }

    res.json({
      success: true,
      data,
      count: data.length,
      timeRange: timeRangeStr,
      rateLimitStatus: githubService.getRateLimitStatus(),
      cacheStats: githubService.getCacheStats()
    });
  } catch (error) {
    handleErrors(createError(error), res);
  }
});

// ✅ 缓存管理端点
router.get('/cache/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: cacheService.getStats()
  });
});

router.delete('/cache', (req: Request, res: Response) => {
  const { pattern } = req.query;
  const patternStr = typeof pattern === 'string' ? pattern : undefined;
  
  githubService.clearCache(patternStr);
  if (!patternStr) {
    clearProcessorCache();
  }
  
  res.json({ 
    success: true, 
    message: patternStr ? `Cleared cache for pattern: ${patternStr}` : 'All cache cleared' 
  });
});

router.post('/cache/cleanup', (req: Request, res: Response) => {
  cacheService.cleanup();
  res.json({ 
    success: true, 
    message: 'Cache cleanup completed',
    stats: cacheService.getStats()
  });
});

export default router;