import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Mock env vars before importing app
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD_HASH = 'test-hash';

const { app } = await import('../src/app.js');

test('GET /login returns 200', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('GET / redirects to /login when not authenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
