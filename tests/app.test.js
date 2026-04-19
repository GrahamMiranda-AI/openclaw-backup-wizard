import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App', () => {
  let app;

  before(async () => {
    // Set up mock process.env before dynamic import
    process.env.PORT = '4281';
    process.env.APP_NAME = 'Test Wizard';
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = 'test-hash';

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET /login returns 200 and login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
    assert.match(res.text, /Test Wizard/);
  });

  test('GET /wizard redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
