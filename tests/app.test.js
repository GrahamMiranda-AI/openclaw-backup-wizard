import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Set up env vars for tests before importing the app
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = 'test-hash';

const { app } = await import('../src/app.js');

test('App routing and auth', async (t) => {
  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<title>OpenClaw Backup Wizard - Login<\/title>/);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('GET /wizard redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
