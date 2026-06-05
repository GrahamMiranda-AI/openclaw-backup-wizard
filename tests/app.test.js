import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

describe('OpenClaw Backup Wizard App', () => {
  let app;
  let ADMIN_PASSWORD_HASH;

  before(async () => {
    ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpassword', 10);
    process.env.ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH;
    process.env.ADMIN_USER = 'admin';
    process.env.SESSION_SECRET = 'test-secret';

    // Use dynamic import so process.env values are picked up by config.js before modules load
    const module = await import('../src/app.js');
    app = module.app;
  });

  test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('POST /login with valid credentials should authenticate and redirect', async () => {
    const agent = request.agent(app);
    const res = await agent
      .post('/login')
      .type('form')
      .send({ username: 'admin', password: 'testpassword' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // The agent now holds the authenticated session cookie
    const wizardRes = await agent.get('/wizard');
    assert.strictEqual(wizardRes.statusCode, 200);
    assert.match(wizardRes.text, /Step 1 — Create backup/);
  });

  test('POST /login with invalid credentials should reject', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('GET /wizard without authentication should redirect to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /logout should destroy session and redirect', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ username: 'admin', password: 'testpassword' });

    const logoutRes = await agent.post('/logout');
    assert.strictEqual(logoutRes.statusCode, 302);
    assert.strictEqual(logoutRes.headers.location, '/login');

    const wizardRes = await agent.get('/wizard');
    assert.strictEqual(wizardRes.statusCode, 302);
    assert.strictEqual(wizardRes.headers.location, '/login');
  });
});
