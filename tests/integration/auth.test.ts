import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import createApp from '../../src/app';
import { db } from '../../src/lib/knex/knex';

const runIt = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

const uniquePhone = () => `+1415555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

const uniqueEmail = () => `customer.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@test.com`;

const customerPayload = () => ({
  email: uniqueEmail(),
  phone: uniquePhone(),
  name: 'Test Customer',
  role: 'customer',
  password: 'StrongPass123!',
});

runIt('integration: auth', () => {
  const app = createApp();

  afterAll(async () => {
    await db.destroy();
  });

  it('registers a customer and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(customerPayload()).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('logs in with valid credentials and returns tokens', async () => {
    const payload = customerPayload();
    await request(app).post('/api/auth/register').send(payload).expect(200);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with wrong credentials', async () => {
    const payload = customerPayload();
    await request(app).post('/api/auth/register').send(payload).expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'WrongPass123!' })
      .expect(401);
  });

  it('rejects registering with an invalid payload', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });
});
