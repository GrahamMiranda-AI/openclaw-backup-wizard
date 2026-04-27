import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App routing and auth', () => {
  let app;

  before(async () => {
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = 'mocked_hash';
    process.env.SESSION_SECRET = 'test_secret';

    const mod = await import('../src/app.js');
    app = mod.app;
  });

  test('GET / redirects to /login if not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard redirects to /login if not authed', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login renders the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Login'));
  });

  test('POST /login with wrong credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });
});
