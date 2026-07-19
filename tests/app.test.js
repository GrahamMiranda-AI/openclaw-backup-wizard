import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

describe('OpenClaw Backup Wizard', () => {
  let app;
  const testPassword = 'my-secure-password';

  before(async () => {
    process.env.PORT = '4281';
    process.env.APP_NAME = 'Test Wizard';
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = hashSync(testPassword, 10);
    process.env.HOME = '/tmp'; // Mock home directory for testing

    const m = await import('../src/app.js');
    app = m.app;
  });

  test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Test Wizard - Login/);
    assert.match(res.text, /Username/);
    assert.match(res.text, /Password/);
  });

  test('POST /login with valid credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: testPassword });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Test the session cookie is set
    assert.ok(res.headers['set-cookie']);
  });

  test('POST /login with invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('GET /wizard returns 302 when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
