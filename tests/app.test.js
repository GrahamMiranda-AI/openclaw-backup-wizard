import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App Routes', () => {
  let app;

  before(async () => {
    process.env.PORT = '4000';
    process.env.APP_NAME = 'Test App';
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = 'test-hash';

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET / redirects to /login', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('GET /login returns 200', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('Login'));
  });
});
