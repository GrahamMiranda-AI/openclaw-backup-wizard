import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mock environment before importing app
const mockHome = path.join(import.meta.dirname, 'mock_home');
if (!fs.existsSync(mockHome)) {
  fs.mkdirSync(mockHome, { recursive: true });
}
if (!fs.existsSync(path.join(mockHome, '.openclaw'))) {
  fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });
}

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$abcdefghijklmnopqrstuv'; // Invalid dummy hash for test
process.env.SESSION_SECRET = 'testsecret';

// Dynamically import app after env setup
const { app } = await import('../src/app.js');

test('GET / redirects to /login when not authed', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});

test('GET /login returns login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login with invalid credentials fails', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
