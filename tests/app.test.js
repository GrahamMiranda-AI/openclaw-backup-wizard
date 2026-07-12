import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';
const { hashSync } = bcryptPkg;

test('App Tests', async (t) => {
  // Set mock environment variables before dynamically importing app
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamically import the app to ensure it picks up the mocked process.env variables
  const { app } = await import('../src/app.js');

  // Need agent to maintain session for multiple requests
  const agent = request.agent(app);

  await t.test('GET /login redirects unauthenticated user from /', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login renders login form', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Sign in'));
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await agent.post('/login').send({ username: 'testadmin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });

  await t.test('POST /login with valid credentials redirects to /wizard', async () => {
    const res = await agent.post('/login').send({ username: 'testadmin', password: 'testpass' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('GET /wizard is accessible for authenticated user', async () => {
    const res = await agent.get('/wizard');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Create backup'));
  });

  await t.test('POST /logout redirects to /login and clears session', async () => {
    const res = await agent.post('/logout');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');

    // verify session cleared
    const resAfter = await agent.get('/wizard');
    assert.strictEqual(resAfter.status, 302);
    assert.strictEqual(resAfter.headers.location, '/login');
  });
});