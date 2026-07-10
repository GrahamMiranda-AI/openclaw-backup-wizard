import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mock environment variables before importing app
process.env.PORT = '0'; // random port for testing
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
// Ensure hash matches the exact bcryptjs output for 'password' with salt rounds 10
process.env.ADMIN_PASSWORD_HASH = '$2a$10$sa4KiyIBsZdX7HSyMh/tp.KWkQc/PNQwAhqnuFzVVojXXbJwPkFlq'; // hash for 'password'

// dynamically import app after environment variables are set
const { app } = await import('../src/app.js');

test('GET / should redirect to /login if unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login should return login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.ok(response.text.includes('<title>Test Wizard - Login</title>'));
  assert.ok(response.text.includes('<form method="post" action="/login" class="stack">'));
});

test('POST /login should reject invalid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.ok(response.text.includes('Invalid login.'));
});

test('POST /login should accept valid credentials and redirect to /wizard', async () => {
  // Using hash generated for 'password'
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'password' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');

  // Verify that it set a session cookie
  const setCookieHeader = response.headers['set-cookie'];
  assert.ok(setCookieHeader);
  assert.ok(setCookieHeader[0].startsWith('connect.sid='));
});
