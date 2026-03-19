import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';

test('GET /login returns 200 and the login form', async () => {
  const response = await request(app).get('/login');
  assert.equal(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login" class="stack">/);
});

test('GET / redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});

test('GET /wizard redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});
