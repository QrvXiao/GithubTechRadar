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

// 转换MongoDB聚合数据为PlotlyData格式
function mongoToPlotlyData(mongoData: any[]): PlotlyData[] {
  if (!mongoData || mongoData.length === 0) return [];
  
  const r = mongoData.map(item => item.totalStars || 0);
  const theta = mongoData.map(item => item.language || 'Unknown');
  const text = mongoData.map(item => 
    `<b>${item.language}</b><br>Total Stars: ${item.totalStars}<br>Repos: ${item.repositoryCount}<br>Trending Score: ${item.trendingScore}`
  );
  const customdata = mongoData.map(item => 
    item.topRepositories?.[0]?.url || '#'
  );

  return [{
    type: 'scatterpolar',
    mode: 'markers',
    r,
    theta,
    text,
    customdata,
    hoverinfo: 'text',
    marker: { size: 8 },
    name: 'Tech Radar',
  }];
}

// GET /api/radar-data - Optimized with MongoDB caching
router.get('/radar-data', validateQuery, async (req: Request, res: Response) => {
  try {
    // 使用验证后的查询参数
    const validatedQuery = (req as any).validatedQuery || req.query;
    const { language, timeRange, limit } = validatedQuery;
    
    const languageStr = typeof language === 'string' ? language : undefined;
    const timeRangeStr = typeof timeRange === 'string' ? timeRange : '7d';
    const limitNum = typeof limit === 'number' ? limit : 50;

    const filter: MongoFilter = {};
    if (languageStr) {
      filter.language = { $in: languageStr.split(',') };
    }
    filter.timeRange = timeRangeStr;

    // ✅ Step 1: 尝试从MongoDB获取数据
    let mongoData = await TechRadar.find(filter)
      .sort({ trendingScore: -1 })
      .limit(limitNum)
      .lean();

    let dataSource = 'cache';
    let isFresh = true;
    let lastUpdated: Date | null = null;

    // ✅ Step 2: 检查数据新鲜度
    if (mongoData.length > 0) {
      lastUpdated = mongoData[0].lastUpdated as Date;
      const dataAge = Date.now() - new Date(lastUpdated).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      
      isFresh = dataAge < maxAge;
      
      if (!isFresh) {
        console.log(`⚠️ Data is stale (${Math.round(dataAge / (24 * 60 * 60 * 1000))} days old)`);
      }
    }

    // ✅ Step 3: 如果没有数据或数据过期，从GitHub拉取
    if (mongoData.length === 0 || !isFresh) {
      console.log('📡 Fetching fresh data from GitHub API...');
      dataSource = 'live';
      
      try {
        const githubData = await githubService.fetchTrendingRepos(languageStr, timeRangeStr);
        
        if (githubData.length > 0) {
          const processedData = aggregateLanguageData(githubData);
          
          // ✅ 更新MongoDB缓存（异步，不阻塞响应）
          Promise.all(
            processedData.map((item: any) =>
              TechRadar.findOneAndUpdate(
                { language: item.language, timeRange: timeRangeStr },
                { ...item, timeRange: timeRangeStr, lastUpdated: new Date() },
                { upsert: true, new: true }
              )
            )
          ).catch((err: Error) => console.error('Failed to update cache:', err));
          
          mongoData = processedData.slice(0, limitNum);
          lastUpdated = new Date();
        } else if (mongoData.length > 0) {
          // 如果API失败但有旧数据，使用旧数据
          console.log('⚠️ Using stale cache as fallback');
          dataSource = 'stale-cache';
        }
      } catch (error) {
        console.error('GitHub API error:', error);
        if (mongoData.length === 0) {
          throw error; // 没有缓存数据时才抛出错误
        }
        dataSource = 'stale-cache'; // 有缓存数据时降级使用
      }
    }

    // ✅ Step 4: 转换为前端需要的格式
    const plotlyData = mongoToPlotlyData(mongoData);

    res.json({
      success: true,
      data: plotlyData, // 直接返回PlotlyData格式
      count: mongoData.length,
      meta: {
        source: dataSource,
        isFresh,
        lastUpdated,
        timeRange: timeRangeStr,
        cached: dataSource === 'cache'
      },
      rateLimitStatus: githubService.getRateLimitStatus(),
      cacheStats: cacheService.getStats()
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

// ✅ 手动触发数据预热
import scheduledJob from '../services/scheduledJob';

router.post('/cache/warmup', async (req: Request, res: Response) => {
  try {
    const result = await scheduledJob.triggerManualFetch();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Warmup failed'
    });
  }
});

router.get('/jobs/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    jobs: scheduledJob.getStatus()
  });
});

export default router;