import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';

test('App routing and basic logic', async (t) => {
  process.env.SESSION_SECRET = 'test-secret';
  process.env.ADMIN_PASSWORD_HASH = 'test-hash';

  const { app } = await import('../src/app.js');
  const request = supertest(app);

  await t.test('GET /login returns login page', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Login'));
  });

  await t.test('GET / redirects to /login if not authed', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
