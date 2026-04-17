import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup environment variables before importing app
process.env.APP_NAME = 'Test Wizard';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('secret', 10);
process.env.LOGO_PATH = '/static/test-logo.jpg';

const { app } = await import('../src/app.js');

test('GET /login renders login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Test Wizard - Login/);
});

test('POST /login with incorrect password fails', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('POST /login with correct password succeeds', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'secret' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('GET / redirects to /login when not authenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /wizard redirects to /login when not authenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
