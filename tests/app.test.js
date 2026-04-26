import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Set minimal env needed for test before importing the app
process.env.ADMIN_PASSWORD_HASH = 'mocked-hash';
process.env.PORT = '0'; // random port

test('App routing tests', async (t) => {
  // Use dynamic import so env vars are set before module evaluation
  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /login if unauthenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login if unauthenticated', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /login returns 200 and renders page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('<h2>Login</h2>'));
  });
});
