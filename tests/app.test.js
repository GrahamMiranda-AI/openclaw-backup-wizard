import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
process.env.SESSION_SECRET = 'testsecret';

const { app } = await import('../src/app.js');

test('GET / redirects to /login when not authenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});

test('GET /login returns the login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /<form method="post" action="\/login" class="stack">/);
  assert.match(response.text, /Login/);
});
