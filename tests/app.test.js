import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';

test('App responds properly to login endpoints', async () => {
  // Set up mock process.env for testing
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamically import the app to ensure config values evaluate with our mocked env vars
  const { app } = await import('../src/app.js');

  await test('GET /login should render login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('Login'));
  });

  await test('POST /login with valid credentials should redirect to wizard', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');
  });

  await test('POST /login with invalid credentials should return 401', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpass' });

    assert.strictEqual(response.status, 401);
  });
});
