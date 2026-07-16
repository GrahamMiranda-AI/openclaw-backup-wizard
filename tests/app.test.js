import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

// Mock environment variables before importing app
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
process.env.SESSION_SECRET = 'test-secret';

// Dynamically import app.js after setting env vars
const { app } = await import('../src/app.js');

test('GET /login should render login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login with valid credentials should authenticate and redirect', async () => {
  const agent = request.agent(app);
  const response = await agent
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass123' })
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('POST /login with invalid credentials should fail', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' })
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('GET /wizard without authentication should redirect to /login', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET / should redirect to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
