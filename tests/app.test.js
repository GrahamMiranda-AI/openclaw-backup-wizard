import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup Mock env vars
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpassword', 10);
process.env.ADMIN_USER = 'admin';
process.env.PORT = '4000';
process.env.SESSION_SECRET = 'testsecret';

const { app } = await import('../src/app.js');

test('GET / redirects to /login if not authenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Login/);
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpassword' })
    .expect(302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('POST /login with invalid credentials returns 401', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET /logo.jpg returns 404 if not found', async () => {
  const res = await request(app).get('/logo.jpg');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.text, 'logo not found');
});

test('GET /wizard redirects to /login if not authenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
