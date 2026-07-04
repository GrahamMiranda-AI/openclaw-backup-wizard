import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

test('App routing and auth checks', async (t) => {
  // Mock env vars before importing the app
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$wT0E8hC8n.x3zLqzL8B3rO/u2q7L3a9L3q7L3q7L3q7L3q7L3q7L3'; // mock hash

  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /login if not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login returns 200 and html', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form/);
    assert.match(res.text, /username/);
  });

  await t.test('GET /wizard redirects to /login if not authed', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
