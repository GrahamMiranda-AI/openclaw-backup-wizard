import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
const MOCK_OPENCLAW = path.join(MOCK_HOME, '.openclaw');

process.env.HOME = MOCK_HOME;
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
process.env.PORT = '0';

// Setup mock openclaw dir
fs.mkdirSync(MOCK_OPENCLAW, { recursive: true });

const { app } = await import('../src/app.js');
// Ensure routes are loaded
await import('../src/routes.js');

test('App responds to /login', async (t) => {
  const req = supertest(app);
  const res = await req.get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Login/);
});

test('App rejects invalid login', async (t) => {
  const req = supertest(app);
  const res = await req.post('/login').send({ username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('App accepts valid login and redirects to /wizard', async (t) => {
  const req = supertest(app);
  const res = await req.post('/login').send({ username: 'admin', password: 'testpass123' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('App redirects unauthenticated user to /login from /wizard', async (t) => {
  const req = supertest(app);
  const res = await req.get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('teardown mock dir', async (t) => {
    await fsp.rm(MOCK_HOME, { recursive: true, force: true });
});
