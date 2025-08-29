import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // API key auth (optional)
  const apiKey = req.headers['x-api-key'];
  
  if (process.env.NODE_ENV === 'production' && !apiKey) {
    res.status(401).json({ message: 'API key required' });
    return;
  }
  
  next();
};

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Simple in-memory rate limiting (consider using Redis in production)
  const clientIP = req.ip;
  // Implement rate limiting logic...
  next();
};