import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

describe('App routes', async () => {
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass123', 10);
  process.env.SESSION_SECRET = 'test-secret';

  const { app } = await import('../src/app.js');
  const request = supertest(app);

  let cookie;

  it('GET / redirects to /login when not authenticated', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('GET /login returns the login page', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  it('POST /login fails with bad credentials', async () => {
    const res = await request.post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  it('POST /login succeeds with correct credentials and sets cookie', async () => {
    const res = await request.post('/login')
      .send({ username: 'testadmin', password: 'testpass123' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Save the session cookie for subsequent tests
    cookie = res.headers['set-cookie'];
    assert.ok(cookie, 'Expected set-cookie header');
  });

  it('GET /wizard returns wizard page when authenticated', async () => {
    const res = await request.get('/wizard')
      .set('Cookie', cookie);
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });

  it('GET / redirects to /wizard when authenticated', async () => {
    const res = await request.get('/')
      .set('Cookie', cookie);
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  it('GET /wizard redirects to /login when not authenticated', async () => {
    const res = await request.get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
