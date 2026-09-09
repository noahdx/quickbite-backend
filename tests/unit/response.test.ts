import { describe, expect, it, vi } from 'vitest';
import { sendSuccess, sendPagination } from '../../src/lib/http/response';
import type { Response } from 'express';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('sendSuccess', () => {
  it('wraps data in a success envelope on 200', () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('uses the provided status code', () => {
    const res = mockRes();
    sendSuccess(res, 'created', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: 'created' });
  });

  it('attaches meta when provided', () => {
    const res = mockRes();
    sendSuccess(res, [], 200, { count: 0 });

    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta: { count: 0 } });
  });
});

describe('sendPagination', () => {
  it('sends data with pagination meta', () => {
    const res = mockRes();
    const meta = { nextCursor: 25, hasMore: true, count: 30 };
    sendPagination(res, [1, 2], meta);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [1, 2], meta });
  });
});
