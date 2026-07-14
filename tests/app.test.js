import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

test('App routing and login authentication', async (t) => {
  // Set up required env variables to test login behavior correctly
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamically import app so it picks up the mocked process.env variables
  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('POST /login with valid credentials succeeds and creates session', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie'], 'Should set session cookie');
  });
});
