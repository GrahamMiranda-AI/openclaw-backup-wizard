import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup Mock Environment
const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
fs.mkdirSync(path.join(MOCK_HOME, '.openclaw'), { recursive: true });

process.env.HOME = MOCK_HOME;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$w/X/eL1Y9/U58Y3M83z7V.N3lR9/V9838/P3L9Y983v/P9v83v83.'; // Just a dummy hash

// Dynamically import app after setting env vars
const { app } = await import('../src/app.js');

test('GET /login returns 200 OK', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('GET /wizard unauthenticated redirects to /login', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

// Cleanup Mock Environment
test.after(() => {
  fs.rmSync(MOCK_HOME, { recursive: true, force: true });
});
