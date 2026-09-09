import { NextFunction, Response, Request } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger/logger';

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  const operational = err.isOperational;

  logger.error(err.message, {
    operational: operational,
    statusCode: err.statusCode,
    correlationId: req.correlationID,
    body: req.body,
    timestamp: new Date().toISOString(),
    stack: err.stack,
  });

  if (operational) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Something went wrong' });
}

/**
 *      statusCode: err.statusCode,
        stack: err.stack,
        operational: operational,
        body: req.body,
        correlationId: req.correlationId
 */
