import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

test('App Endpoints', async (t) => {
  // Mock environment variables
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'testsecret';

  // Dynamically import the app so it picks up the mocked process.env
  const { app } = await import('../src/app.js');

  await t.test('GET / should redirect to /login if not authed', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('POST /login should fail with wrong credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  let sessionCookie;

  await t.test('POST /login should succeed with right credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Save the session cookie for subsequent requests
    sessionCookie = res.headers['set-cookie'];
  });

  await t.test('GET /wizard should require auth', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard should work if authed', async () => {
    const res = await request(app)
      .get('/wizard')
      .set('Cookie', sessionCookie);

    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1/);
  });
});
