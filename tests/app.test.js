import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('App', async () => {
  const mockPassword = 'test-password';
  const mockPasswordHash = await bcrypt.hash(mockPassword, 10);

  process.env.ADMIN_USER = 'test-admin';
  process.env.ADMIN_PASSWORD_HASH = mockPasswordHash;
  process.env.SESSION_SECRET = 'test-secret';

  const { app } = await import('../src/app.js');
  const { APP_NAME } = await import('../src/config.js');

  it('unauthenticated GET / redirects to /login', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('unauthenticated GET /wizard redirects to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, new RegExp(`${APP_NAME} - Login`));
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  it('POST /login redirects to /wizard with correct credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'test-admin', password: mockPassword });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Cookie parsing
    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie && setCookie.length > 0);
  });

  it('POST /login returns 401 with incorrect credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'test-admin', password: 'wrong-password' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
