import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup mock environment variables before importing app
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpassword', 10);
process.env.SESSION_SECRET = 'test-secret';
process.env.APP_NAME = 'Test App';

const { app } = await import('../src/app.js');

test('GET / redirects to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login returns 200 OK and renders login form', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
  assert.match(response.text, /Test App/);
});

test('POST /login with invalid credentials returns 401 Unauthorized', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpassword' });
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});
