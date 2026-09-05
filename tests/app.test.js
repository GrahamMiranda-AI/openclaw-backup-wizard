import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

const mockHome = path.join(import.meta.dirname, 'mock_home');
fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'admin';
const bcrypt = bcryptPkg.default || bcryptPkg;
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');
const { setupRoutes } = await import('../src/routes.js');
setupRoutes(app);

test('GET /login returns login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login with valid credentials redirects to wizard', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('POST /login with invalid credentials returns 401', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
