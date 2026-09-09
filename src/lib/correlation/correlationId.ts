import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const id = uuidv4();
  req.correlationID = id;
  res.setHeader('X-Correlation-ID', id);
  next();
}
