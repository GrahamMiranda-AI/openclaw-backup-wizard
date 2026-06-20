import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup environment before importing the app
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');

test('GET /login returns 200 and shows login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Login/);
});

test('POST /login with bad credentials returns 401', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET /wizard unauthenticated redirects to /login', async () => {
  const res = await request(app).get('/wizard');

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('POST /login with correct credentials redirects to /wizard', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});
