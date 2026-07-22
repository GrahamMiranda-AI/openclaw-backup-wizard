import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';
const { hashSync } = bcryptPkg;

// Set mock environment variables
process.env.PORT = '4281';
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
process.env.LOGO_PATH = '/static/logo.jpg';
process.env.HOME = '/tmp/test_home';

// Import app after env vars are set
const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.statusCode, 200);
  assert.match(res.text, /Test Wizard/);
  assert.match(res.text, /<form method="post" action="\/login"/);
});

test('POST /login with invalid credentials fails', async () => {
  const res = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(res.statusCode, 401);
  assert.match(res.text, /Invalid login/);
});

test('POST /login with valid credentials redirects to wizard', async () => {
  const res = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'testadmin', password: 'testpass123' });

  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/wizard');

  // Verify cookie is set
  const cookies = res.headers['set-cookie'];
  assert.ok(cookies, 'Expected Set-Cookie header');
  assert.ok(cookies.some(c => c.includes('connect.sid')), 'Expected session cookie');
});

test('GET / redirects to /login when unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET / redirects to /wizard when authenticated', async () => {
  // First login
  const loginRes = await request(app)
    .post('/login')
    .type('form')
    .send({ username: 'testadmin', password: 'testpass123' });

  const cookies = loginRes.headers['set-cookie'];

  // Then get /
  const res = await request(app)
    .get('/')
    .set('Cookie', cookies);

  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});
