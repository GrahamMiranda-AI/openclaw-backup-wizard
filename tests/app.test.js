import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD_HASH = 'test-hash';

test('App routing', async (t) => {
  const { app } = await import('../src/app.js');

  await t.test('Root route redirects to login', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('Login route returns 200', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
  });
});
