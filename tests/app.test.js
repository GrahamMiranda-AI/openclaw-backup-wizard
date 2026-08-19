import { test, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

let app;

before(async () => {
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');
  fs.mkdirSync(mockOpenclaw, { recursive: true });

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$ugK66ipFubZdXMDFY2oe9.2tI.HsJ8l2QhF18Jy87eldJoIGeRhbm'; // "password"

  // Dynamically import app after env vars are set to prevent hoisting evaluation issues
  const mod = await import('../src/app.js');
  app = mod.app;
});

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /<form method="post" action="\/login"/);
});

test('GET / redirects to /login when unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('POST /login with correct password redirects to /wizard', async () => {
  const res = await request(app)
    .post('/login')
    .send('username=admin&password=password')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('POST /login with wrong password returns 401', async () => {
  const res = await request(app)
    .post('/login')
    .send('username=admin&password=wrong')
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});
