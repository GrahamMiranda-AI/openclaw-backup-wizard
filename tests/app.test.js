import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';

test('App routing and auth flow', async (t) => {
  // Set mock env vars before importing app
  process.env.SESSION_SECRET = 'test-secret';
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass123', 10);

  const { app } = await import('../src/app.js');

  await t.test('GET /login returns 200 OK', async () => {
    const res = await supertest(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with invalid credentials returns 401', async () => {
    const res = await supertest(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('POST /login with valid credentials logs in and redirects', async () => {
    const agent = supertest.agent(app);

    // Login
    const loginRes = await agent
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' });

    assert.strictEqual(loginRes.statusCode, 302);
    assert.strictEqual(loginRes.headers.location, '/wizard');

    // Access wizard with session cookie
    const wizardRes = await agent.get('/wizard');
    assert.strictEqual(wizardRes.statusCode, 200);
    assert.match(wizardRes.text, /Step 1 — Create backup/);
  });
});
