import * as cron from 'node-cron';
import githubService from './githubService';
import { aggregateLanguageData } from './dataProcessor';
import TechRadar from '../models/TechRadar';
import RepoData from '../models/RepoData';
import { logger } from '../utils/logger';

class ScheduledJobService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  // Start all scheduled jobs
  startAll(): void {
    this.startWeeklyDataFetch();
    this.startDailyCleanup();
    logger.info('✅ All scheduled jobs started');
  }

  // Automatically fetch data every Monday at 2:00 AM
  private startWeeklyDataFetch(): void {
    // Cron format: second minute hour day month weekday
    // '0 2 * * 1' = Every Monday 02:00
    const job = cron.schedule('0 2 * * 1', async () => {
      logger.info('🔄 Starting weekly data fetch job...');
      await this.fetchAndCacheData();
    }, {
      timezone: 'Asia/Shanghai' // Adjust according to your timezone
    });

    this.jobs.set('weeklyDataFetch', job);
    logger.info('📅 Weekly data fetch job scheduled (Every Monday 2:00 AM)');
  }

  // Clean up expired data every day at 3:00 AM
  private startDailyCleanup(): void {
    const job = cron.schedule('0 3 * * *', async () => {
      logger.info('🧹 Starting daily cleanup job...');
      await this.cleanupOldData();
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('dailyCleanup', job);
    logger.info('📅 Daily cleanup job scheduled (Every day 3:00 AM)');
  }

  // Core: Fetch and cache data to MongoDB
  async fetchAndCacheData(): Promise<void> {
    const timeRanges = ['7d', '30d'] as const;
    const languages = ['', 'JavaScript', 'Python', 'TypeScript', 'Java', 'Go', 'Rust'];

    let successCount = 0;
    let errorCount = 0;

    for (const timeRange of timeRanges) {
      for (const language of languages) {
        try {
          logger.info(`Fetching: ${language || 'all'} - ${timeRange}`);
          
          // Fetch data from GitHub API
          const githubData = await githubService.fetchTrendingRepos(language, timeRange);
          
          if (githubData.length === 0) {
            logger.warn(`No data found for ${language || 'all'} - ${timeRange}`);
            continue;
          }

          // Save each repo's data (instead of aggregated data)
          for (const repo of githubData) {
            if (!repo.language) continue;
            
            await RepoData.findOneAndUpdate(
              { 
                repoId: repo.id,
                timeRange: timeRange 
              },
              {
                repoId: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                description: repo.description,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                createdAt: new Date(repo.created_at),
                updatedAt: new Date(repo.updated_at),
                lastFetched: new Date(),
                timeRange: timeRange
              },
              { 
                upsert: true, 
                new: true 
              }
            );
          }

          successCount++;
          logger.info(`✅ Cached ${githubData.length} repos for ${language || 'all'} - ${timeRange}`);
          
          // Add delay to avoid frequent API requests
          await this.sleep(2000);
          
        } catch (error) {
          errorCount++;
          logger.error(`❌ Error fetching ${language || 'all'} - ${timeRange}:`, error);
        }
      }
    }

    logger.info(`📊 Job completed: ${successCount} success, ${errorCount} errors`);
  }

  // Clean up data older than 30 days
  private async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result1 = await TechRadar.deleteMany({
        lastUpdated: { $lt: thirtyDaysAgo }
      });

      const result2 = await RepoData.deleteMany({
        lastFetched: { $lt: thirtyDaysAgo }
      });

      logger.info(`🗑️ Cleaned up ${result1.deletedCount} aggregated records and ${result2.deletedCount} repo records`);
    } catch (error) {
      logger.error('❌ Error during cleanup:', error);
    }
  }

  // Manually trigger data fetch (for testing or emergency updates)
  async triggerManualFetch(): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('🚀 Manual data fetch triggered');
      await this.fetchAndCacheData();
      return { 
        success: true, 
        message: 'Data fetch completed successfully' 
      };
    } catch (error) {
      logger.error('❌ Manual fetch failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Stop all jobs
  stopAll(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  // Get job status
  getStatus(): { name: string; running: boolean }[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.getStatus() === 'scheduled'
    }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ScheduledJobService();
