import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Mock environment for deterministic testing
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$YDCna6UTcIHfjrhVwZVdgOAnZbuDoYO.HWO7CgAZLgYbbvtQa11CK'; // Mock hash for 'password'

// Dynamically import the app after setting environment variables
const { app } = await import('../src/app.js');

test('GET / should redirect to /wizard if authenticated or /login if not', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login'); // Unauthenticated default
});

test('GET /login should render the login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('POST /login should fail with invalid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});

test('POST /login should succeed with valid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'password' });
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');
});
