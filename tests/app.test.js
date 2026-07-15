import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

describe('App Tests', async () => {
  // Set up test environment variables
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamically import the app after setting environment variables
  const { app } = await import('../src/app.js');

  test('GET /wizard unauthenticated redirects to /login', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/login');
  });

  test('POST /login with correct credentials succeeds and redirects to /wizard', async () => {
    const response = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'testpass123' });

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/wizard');

    // Check that session cookie is set
    const cookies = response.header['set-cookie'];
    assert.ok(cookies && cookies.length > 0);
    assert.ok(cookies[0].includes('connect.sid'));
  });

  test('POST /login with incorrect credentials fails with 401', async () => {
    const response = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(response.status, 401);
  });
});
