import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';

// Mock env vars before dynamically importing app
process.env.HOME = path.join(import.meta.dirname, 'mock_home');
process.env.ADMIN_USER = 'admin';
// bcrypt hash for "password"
process.env.ADMIN_PASSWORD_HASH = '$2a$10$T8Z.Xo1v92aZ07y9D3lA3uC76V/Y0Z.0.O.p1.k2.y1.l.p1.9.0';
process.env.SESSION_SECRET = 'test-secret';

// Create mock .openclaw dir to avoid archiver globbing whole actual home dir
fs.mkdirSync(path.join(process.env.HOME, '.openclaw'), { recursive: true });

// Dynamically import the app after env setup
const { app } = await import('../src/app.js');
const request = supertest(app);

test('unauthenticated user is redirected from /wizard to /login', async () => {
  const response = await request.get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('unauthenticated user is redirected from / to /login', async () => {
  const response = await request.get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('login page renders correctly', async () => {
  const response = await request.get('/login');
  assert.strictEqual(response.status, 200);
  assert.ok(response.text.includes('Login'));
  assert.ok(response.text.includes('OpenClaw Backup Wizard'));
});
