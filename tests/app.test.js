import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Setup environment mocks
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpassword', 10);
process.env.SESSION_SECRET = 'test-secret';
process.env.APP_NAME = 'Test App';

// Use dynamic import so env vars take effect
const { app } = await import('../src/app.js');

test('GET / should redirect to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login should return the login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
  assert.match(response.text, /Test App/);
});

test('POST /login should authenticate user with correct credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpassword' })
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');

  // Verify cookie is set
  const cookies = response.headers['set-cookie'];
  assert.ok(cookies && cookies.length > 0);
  assert.match(cookies[0], /connect\.sid/);
});

test('POST /login should fail with incorrect credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'wrongpassword' })
    .set('Content-Type', 'application/x-www-form-urlencoded');

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
