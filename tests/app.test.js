import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App Tests', () => {
  let app;

  before(async () => {
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
    process.env.SESSION_SECRET = 'test-secret';
    process.env.PORT = '4281';

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET / redirects to /login when not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  test('POST /login with valid credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  test('POST /login with invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
