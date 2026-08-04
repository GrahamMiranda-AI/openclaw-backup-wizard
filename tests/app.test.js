import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import request from 'supertest';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

// Setup environment BEFORE importing the app to mock directories and secrets
process.env.HOME = path.resolve(import.meta.dirname, '../mock_home');
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('testpass123', 10);
process.env.SESSION_SECRET = 'test-secret';

// Use dynamic import so it runs after process.env changes
const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login with valid credentials authenticates', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass123' })
    .expect(302); // Expect redirect to wizard

  assert.match(response.headers.location, /\/wizard/);
});

test('POST /login with invalid credentials fails', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('GET /wizard redirects to login if unauthenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.match(response.headers.location, /\/login/);
});
