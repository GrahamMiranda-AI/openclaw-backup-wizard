import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Setup mock environment variables BEFORE importing app
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$xyz...'; // Mock hash
process.env.SESSION_SECRET = 'test-secret';

test('App responds to /login', async (t) => {
  // Dynamically import app so environment variables are applied
  const { app } = await import('../src/app.js');

  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('App redirects to /login if not authenticated', async (t) => {
  const { app } = await import('../src/app.js');

  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
