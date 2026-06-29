import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Tests', () => {
  let app;
  const mockPassword = 'testpassword123';
  const mockHash = bcrypt.hashSync(mockPassword, 10);

  before(async () => {
    process.env.PORT = '4281';
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = mockHash;
    process.env.SESSION_SECRET = 'test-secret';
    process.env.APP_NAME = 'Test Wizard';

    // Dynamic import to avoid ESM hoisting
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login with valid credentials succeeds and sets cookie', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: mockPassword });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie && setCookie.length > 0);
  });

  test('GET /wizard requires authentication', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
