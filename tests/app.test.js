import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Tests', () => {
  let app;

  before(async () => {
    // Set up mock environment variables for testing before importing the app
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

    // Dynamically import the app to ensure it uses the mock env vars
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET /login should return 200', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('Login'));
  });

  test('GET /wizard should redirect to /login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login with correct credentials should redirect to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  test('POST /login with incorrect credentials should return 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
  });
});
