import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

test('App Basic Routes', async (t) => {
  // Set up mock process.env values before dynamically importing the app
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$.PLgvAhaHu1XS2wMrZveVOa/CMv.1RLAxpmfI7XXtFhUNN/uSfLKC'; // from earlier

  const { app } = await import('../src/app.js');

  await t.test('GET / should redirect to /wizard if authenticated or /login if not', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
    assert.match(res.text, /Username/);
    assert.match(res.text, /Password/);
  });

  await t.test('POST /login with correct credentials should redirect to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'TestPassword123!' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie'], 'Should set session cookie');
  });

  await t.test('POST /login with incorrect credentials should return 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
