import { Response } from 'express';
import { PaginationMeta } from './pagination/cursor-pagination';

export interface AppResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: Object;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: Object) {
  const body: AppResponse<T> = { success: true, data: data };

  if (meta) body.meta = meta;

  res.status(statusCode).json(body);
}

export function sendPagination<T>(res: Response, data: T[], meta: PaginationMeta) {
  sendSuccess(res, data, 200, meta);
}
