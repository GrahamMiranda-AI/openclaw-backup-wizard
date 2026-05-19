import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup environment before importing app since it defines paths at file scope
process.env.PORT = '4000';
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('password123', 10);
process.env.HOME = '/tmp/test_home';

const { app } = await import('../src/app.js');

test('GET / should redirect to /login when unauthenticated', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /login should return HTML login form', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Test Wizard - Login/);
  assert.match(res.text, /<form method="post" action="\/login"/);
});

test('POST /login with invalid credentials should return 401', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('POST /login with valid credentials should redirect to /wizard', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'password123' });

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});
