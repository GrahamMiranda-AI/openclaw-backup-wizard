import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import path from 'path';

// Setup basic environment variables before anything is imported
process.env.APP_NAME = 'Test App';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = 'dummy';
process.env.PORT = '0';

// Import app dynamically so env variables apply
const { app } = await import('../src/app.js');

test('Redirect to login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.equal(response.status, 302);
  assert.equal(response.header.location, '/login');
});

test('Render login page', async () => {
  const response = await request(app).get('/login');
  assert.equal(response.status, 200);
  assert.ok(response.text.includes('Login'));
});

test('Fail login with invalid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.equal(response.status, 401);
  assert.ok(response.text.includes('Invalid login'));
});
