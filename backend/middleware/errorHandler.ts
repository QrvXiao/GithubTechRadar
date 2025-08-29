import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const handleErrors = (error: Error, res: Response): void => {
  logger.error({
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }

  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  handleErrors(err, res);
};

export { handleErrors, errorHandler, logger };