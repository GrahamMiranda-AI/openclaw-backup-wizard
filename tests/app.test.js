import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import fs from 'fs';
import path from 'path';

describe('App Integration Tests', async () => {
  let app;
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclawDir = path.join(mockHome, '.openclaw');

  before(async () => {
    // Setup Mock Environment
    process.env.HOME = mockHome;
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = '$2a$10$tdGzzzt0sANErnNOBo5ER.P/NyUyLCHvWas2BdzTRaRk/ivB5Dklm'; // 'test'
    process.env.SESSION_SECRET = 'test-secret';

    fs.mkdirSync(mockOpenclawDir, { recursive: true });

    // Dynamically import app after setting environment variables
    const imported = await import('../src/app.js');
    app = imported.app;
  });

  after(() => {
    // Clean up
    fs.rmSync(mockHome, { recursive: true, force: true });
  });

  test('GET /login renders login page', async () => {
    const res = await supertest(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<title>OpenClaw Backup Wizard - Login<\/title>/);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('GET / redirects to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard redirects to /login when unauthenticated', async () => {
    const res = await supertest(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login succeeds with correct credentials and redirects to /wizard', async () => {
    const agent = supertest.agent(app);
    const res = await agent
      .post('/login')
      .send('username=testadmin&password=test')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Follow redirect to ensure session is authenticated
    const wizardRes = await agent.get('/wizard');
    assert.strictEqual(wizardRes.status, 200);
    assert.match(wizardRes.text, /Step 1 — Create backup/);
  });

  test('POST /login fails with bad credentials', async () => {
    const res = await supertest(app)
      .post('/login')
      .send('username=testadmin&password=wrongpassword')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
