import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('GET / unauthenticated redirects to /login', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});

test('GET /login renders login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
  assert.match(response.text, /Username/);
  assert.match(response.text, /Password/);
});

test('GET /wizard unauthenticated redirects to /login', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});
