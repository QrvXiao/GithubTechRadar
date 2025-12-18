import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import routerRoutes from './routes/router';
import { errorHandler } from './middleware/errorHandler';
import scheduledJob from './services/scheduledJob';
import { logger } from './utils/logger';

dotenv.config();

const app: Application = express();

// middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log('✅ MongoDB connected');
    
    // Start scheduled jobs
    scheduledJob.startAll();
    
    // Warm up cache on server start (optional)
    if (process.env.WARMUP_ON_START === 'true') {
      logger.info('🔥 Starting cache warmup...');
      scheduledJob.triggerManualFetch()
        .then(() => logger.info('✅ Cache warmup completed'))
        .catch(err => logger.error('❌ Cache warmup failed:', err));
    }
  })
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// routes 
app.use('/api', apiRoutes);
app.use('/api', routerRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Tech Radar API Running');
});

// error handling 
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT as string) || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Scheduled jobs: ${scheduledJob.getStatus().length} active`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  scheduledJob.stopAll();
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});