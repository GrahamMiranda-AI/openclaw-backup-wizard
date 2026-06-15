import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Endpoints', async () => {
  // Set mock environment variables before importing app to avoid ESM hoisting issues
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'testsecret';

  const { app } = await import('../src/app.js');

  test('GET /login returns login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Login/);
  });

  test('POST /login with valid credentials redirects to wizard', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');
  });

  test('POST /login with invalid credentials returns 401', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(response.status, 401);
    assert.match(response.text, /Invalid login/);
  });

  test('GET /wizard without auth redirects to login', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });
});