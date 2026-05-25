import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Setup mock process.env variables before importing app
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD_HASH = 'mockhash';

// Use dynamic import so it picks up the env vars
const { app } = await import('../src/app.js');

test('GET / should redirect to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login should render the login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
  assert.match(response.text, /Username/);
  assert.match(response.text, /Password/);
});
