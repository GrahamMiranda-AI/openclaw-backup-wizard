import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Integration Tests', async () => {
  // Set mock environment variables
  process.env.SESSION_SECRET = 'test-secret';
  process.env.ADMIN_USER = 'testadmin';
  const testPassword = 'testpassword';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(testPassword, 10);

  // Dynamically import the app after setting env vars
  const { app } = await import('../src/app.js');

  test('GET /login should return 200 and login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  test('GET / should redirect to /login without auth', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login with invalid credentials should return 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login with valid credentials should redirect to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: testPassword });
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Cookie should be set
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    assert.ok(cookies.some(c => c.includes('connect.sid')));
  });
});
