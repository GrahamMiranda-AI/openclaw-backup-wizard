import { test } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

// Set mock environment variables before importing anything
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
process.env.PORT = '4281'; // Avoid conflicts if server is running
process.env.SESSION_SECRET = 'test-secret';

// Dynamically import the app to ensure it picks up the mocked env vars
const { app } = await import('../src/app.js');

test('Unauthenticated user is redirected from / to /login', async () => {
  const response = await supertest(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('Unauthenticated user is redirected from /wizard to /login', async () => {
  const response = await supertest(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login returns 200 and the login page', async () => {
  const response = await supertest(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.ok(response.text.includes('<h2>Login</h2>'), 'Page should contain Login heading');
  assert.ok(response.text.includes('name="username"'), 'Page should contain username input');
  assert.ok(response.text.includes('name="password"'), 'Page should contain password input');
});

test('POST /login with invalid credentials returns 401', async () => {
  const response = await supertest(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.ok(response.text.includes('Invalid login.'), 'Should display invalid login message');
});

test('POST /login with valid credentials redirects to /wizard', async () => {
  const response = await supertest(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');

  // Verify that a session cookie was set
  const cookies = response.headers['set-cookie'];
  assert.ok(cookies && cookies.length > 0, 'Session cookie should be set');
});
