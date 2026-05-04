import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup environment before importing anything else
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.APP_NAME = 'Test Wizard';

const { app } = await import('../src/app.js');

test('GET / redirects to /login when unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
});

test('GET /login returns HTML with login form', async () => {
  const res = await request(app).get('/login');
  assert.equal(res.status, 200);
  assert.match(res.text, /<form method="post" action="\/login"/);
});

test('POST /login with invalid credentials fails', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });
  assert.equal(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('POST /login with valid credentials succeeds', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/wizard');
});
