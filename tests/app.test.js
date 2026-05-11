import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

test('App routing and login flows', async (t) => {
  // Set mock environment variables before importing app
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamically import app so that config variables are evaluated with the mock env above
  const { app } = await import('../src/app.js');
  const request = supertest(app);

  await t.test('GET / should redirect to /login when not authenticated', async () => {
    const response = await request.get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('POST /login with correct credentials should set session and redirect to /wizard', async () => {
    const response = await request.post('/login')
      .send({ username: 'admin', password: 'testpass' })
      .type('form');

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');

    // Make sure a cookie (session) is returned
    const cookies = response.headers['set-cookie'];
    assert.ok(cookies && cookies.length > 0, 'Session cookie should be set');
  });

  await t.test('POST /login with incorrect credentials should return 401', async () => {
    const response = await request.post('/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .type('form');

    assert.strictEqual(response.status, 401);
  });
});
