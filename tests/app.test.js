import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

describe('App Tests', () => {
  let app;

  before(async () => {
    // Setup mock environment variables before importing app
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
    process.env.SESSION_SECRET = 'test-secret';
    process.env.PORT = '4000';

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('GET / redirects to /login if not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns HTML', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('POST /login fails with bad credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login redirects to /wizard with good credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });
});
