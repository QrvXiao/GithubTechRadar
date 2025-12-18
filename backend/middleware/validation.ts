import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateQuery = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    language: Joi.string().optional(),
    timeRange: Joi.string().valid('1d', '7d', '30d').default('7d'),
    limit: Joi.number().min(1).max(100).default(50)
  });
  
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.details[0].message 
    });
  }
  
  // Store validated values in req object instead of overwriting req.query
  (req as any).validatedQuery = value;
  next();
};

export const validateRadarData = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    language: Joi.string().required(),
    stars: Joi.number().min(0).required(),
    forks: Joi.number().min(0).optional(),
    trendingScore: Joi.number().min(0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};