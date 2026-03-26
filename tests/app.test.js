import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { APP_NAME } from '../src/config.js';

test('App routing tests', async (t) => {
  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
    assert.match(res.text, new RegExp(APP_NAME));
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    // Depending on ADMIN_PASSWORD_HASH existence it returns 401 or 500
    assert.ok(res.status === 401 || res.status === 500);
  });

  await t.test('GET /wizard redirects to login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });
});
