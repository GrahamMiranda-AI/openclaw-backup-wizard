import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Authentication Tests', () => {
  let app;
  const testPassword = 'mysecretpassword';

  before(async () => {
    const hash = await bcrypt.hash(testPassword, 10);
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = hash;

    // Dynamically import the app after setting env vars
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  after(() => {
    delete process.env.ADMIN_USER;
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  test('GET /login should return the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  test('POST /login with correct credentials should redirect and set session', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: testPassword });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Should return session cookies');
    assert.ok(cookies.some(c => c.includes('connect.sid')), 'Should have connect.sid cookie');
  });

  test('POST /login with incorrect credentials should return 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });
});
