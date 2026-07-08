import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

// Mock environment variables before importing anything
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
process.env.APP_NAME = 'Test Wizard';
process.env.PORT = '4281';

// Import app dynamically to ensure env vars are applied
const { app } = await import('../src/app.js');

test('GET /login should render login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Test Wizard/);
  assert.match(response.text, /Login/);
});

test('POST /login should authenticate with correct credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass123' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});

test('POST /login should reject incorrect credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('GET /wizard should redirect to login if not authenticated', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
