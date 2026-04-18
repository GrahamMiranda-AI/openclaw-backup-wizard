import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

test('App routing and authentication', async (t) => {
  // Set mock environment variables BEFORE importing the app
  process.env.PORT = '4281';
  process.env.APP_NAME = 'Test App';
  process.env.SESSION_SECRET = 'test-secret';
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.HOME = '/tmp/test-home';

  // Dynamic import of the app after setting environment variables
  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with correct credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie'], 'Session cookie should be set');
  });

  await t.test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'wrongpass' });

    assert.strictEqual(res.status, 401);
  });
});
