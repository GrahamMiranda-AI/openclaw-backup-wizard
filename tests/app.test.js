import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Setup mock environment variables before importing app
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD_HASH = 'mocked-hash';

const { app } = await import('../src/app.js');

test('Unauthenticated user is redirected to login from wizard', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('Unauthenticated user is redirected to login from root', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login returns login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login"/);
});
