import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

test('Application Endpoints', async (t) => {
  // Mock environment variables before importing app
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamic import ensures the app is initialized with the mocked environment
  const { app } = await import('../src/app.js');
  const request = supertest(app);

  await t.test('GET / redirects to /login when not authenticated', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login returns 200 and the login page', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Login'));
  });

  await t.test('GET /wizard redirects to /login when not authenticated', async () => {
    const res = await request.get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with correct credentials sets session and redirects to /wizard', async () => {
    const res = await request.post('/login')
      .send({ username: 'testadmin', password: 'testpass' })
      .expect(302);

    assert.strictEqual(res.headers.location, '/wizard');

    // Extract session cookie to test authenticated access
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Session cookie should be set');

    const wizardRes = await request.get('/wizard').set('Cookie', cookies);
    assert.strictEqual(wizardRes.status, 200);
    assert.ok(wizardRes.text.includes('Step 1 — Create backup'));
  });

  await t.test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request.post('/login')
      .send({ username: 'testadmin', password: 'wrongpass' });
    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });
});
