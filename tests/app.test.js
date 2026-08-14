import { test, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';

let app;
const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');

before(async () => {
  // Setup mock HOME and .openclaw dir before importing app to avoid globbing real directories
  await fsp.mkdir(path.join(MOCK_HOME, '.openclaw'), { recursive: true });
  process.env.HOME = MOCK_HOME;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$XU0Y1O0y0Q7W7W3M7F5Z7.XU0Y1O0y0Q7W7W3M7F5Z7.XU0Y1O0y0Q'; // Mock hash

  const appModule = await import('../src/app.js');
  app = appModule.app;
});

after(async () => {
  await fsp.rm(MOCK_HOME, { recursive: true, force: true });
});

test('GET /login returns 200', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login"/);
});

test('GET / redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /wizard redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
