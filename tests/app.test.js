import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpassword', 10);

const { app } = await import('../src/app.js');

test('GET / redirects to login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/login');
});

test('GET /login returns login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login handles successful login', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpassword' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.header.location, '/wizard');
});

test('POST /login handles incorrect password', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
