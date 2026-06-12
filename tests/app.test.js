import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

test('App routing and auth flow', async (t) => {
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /login if unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login if unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with bad credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send('username=testadmin&password=wrongpass');
    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('POST /login with correct credentials succeeds', async () => {
    const res = await request(app)
      .post('/login')
      .send('username=testadmin&password=testpass');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });
});
