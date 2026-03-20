import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';

test('GET /login should return 200', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('GET /wizard should redirect to /login if unauthenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
