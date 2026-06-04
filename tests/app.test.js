import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

const { app } = await import('../src/app.js');

test('GET /login returns 200 and login form', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /<h2>Login<\/h2>/);
});

test('GET / redirects to /login when unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
