import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import supertest from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenClaw = path.join(mockHome, '.openclaw');
fs.mkdirSync(mockOpenClaw, { recursive: true });

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = hashSync('password123', 10);
process.env.SESSION_SECRET = 'test-secret';
process.env.APP_NAME = 'Test App';

// Dynamically import app so environment variables apply to config
const { app } = await import('../src/app.js');
const request = supertest(app);

test('GET /login renders login page', async () => {
  const res = await request.get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Test App - Login/);
});

test('POST /login handles valid credentials', async () => {
  const res = await request.post('/login')
    .send({ username: 'admin', password: 'password123' })
    .expect(302);

  assert.strictEqual(res.headers.location, '/wizard');
});

test('POST /login handles invalid credentials', async () => {
  const res = await request.post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET / redirects to /login if unauthenticated', async () => {
  const res = await request.get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /wizard redirects to /login if unauthenticated', async () => {
  const res = await request.get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
