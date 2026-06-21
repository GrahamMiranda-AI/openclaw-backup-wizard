import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App routes', () => {
  let app;

  before(async () => {
    // Set mock env vars before dynamically importing app
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = 'mockhash';
    process.env.SESSION_SECRET = 'testsecret';

    const mod = await import('../src/app.js');
    app = mod.app;
  });

  test('GET / redirects to /login when not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
    assert.match(res.text, /Username/);
    assert.match(res.text, /Password/);
  });
});
