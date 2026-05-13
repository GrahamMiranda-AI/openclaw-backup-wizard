import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Set mock environment variables before importing anything else
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = 'test_hash'; // Doesn't matter what this is for 200/302 tests
process.env.SESSION_SECRET = 'test_secret';

// Dynamically import app so the mock variables apply
const { app } = await import('../src/app.js');

test('GET / redirects to /login', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login returns 200 OK', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});
