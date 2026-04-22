import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$wN1F1y1R1w1F1y1R1w1F1e1R1w1F1y1R1w1F1y1R1w1F1y1R1w1F1';

const { app } = await import('../src/app.js');

test('GET /login returns 200 and login form', async () => {
  const response = await request(app).get('/login');
  assert.equal(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login" class="stack">/);
});

test('GET /wizard unauthenticated redirects to /login', async () => {
  const response = await request(app).get('/wizard');
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});

test('GET / unauthenticated redirects to /login', async () => {
  const response = await request(app).get('/');
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});
