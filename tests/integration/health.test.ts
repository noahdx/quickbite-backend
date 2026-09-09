import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import createApp from '../../src/app';
import { db } from '../../src/lib/knex/knex';

const runIt = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

runIt('integration: health', () => {
  const app = createApp();

  afterAll(async () => {
    await db.destroy();
  });

  it('GET /api/health returns OK when the DB is reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});
