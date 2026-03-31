import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('GET / redirects to /login', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login returns HTML form', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.ok(response.text.includes('<h2>Login</h2>'));
  assert.ok(response.text.includes('<form'));
});

test('GET /logo.jpg returns 404 if not found', async () => {
  const response = await request(app).get('/logo.jpg');
  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.text, 'logo not found');
});

test('GET /wizard redirects to /login if not authenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
