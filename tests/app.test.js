import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Endpoints', () => {
  let app;

  before(async () => {
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
    process.env.SESSION_SECRET = 'test-secret';
    process.env.APP_NAME = 'Test App';
    process.env.PORT = '3000';

    const mod = await import('../src/app.js');
    app = mod.app;
  });

  test('GET / should redirect to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard should redirect to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login with invalid credentials should return 401', async () => {
    const res = await supertest(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login with valid credentials should return 302 and redirect to /wizard', async () => {
    const res = await supertest(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Check that session cookie was set
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Expected session cookie to be set');
    assert.ok(cookies.some(c => c.includes('connect.sid')), 'Expected connect.sid cookie');
  });
});
