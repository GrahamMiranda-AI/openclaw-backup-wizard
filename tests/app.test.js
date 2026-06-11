import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

test('App routing', async (t) => {
  // Set minimal required env variables for config
  process.env.SESSION_SECRET = 'test-secret';
  process.env.ADMIN_PASSWORD_HASH = 'test-hash';

  // Dynamically import app AFTER setting env variables
  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /login when not authenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /login returns the login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /<form method="post" action="\/login" class="stack">/);
    assert.match(response.text, /Sign in/);
  });
});
