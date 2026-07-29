import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';

let app;
let agent;

describe('OpenClaw Backup Wizard Tests', () => {
  before(async () => {
    // Set HOME to our isolated mock home to avoid globbing real ~ directories
    process.env.HOME = path.join(import.meta.dirname, 'mock_home');

    // Set admin credentials for testing
    process.env.ADMIN_USER = 'admin';
    // Hash for 'TestPass123'
    process.env.ADMIN_PASSWORD_HASH = '$2a$10$3z4qg6/yjokylSQ75Zq02uV4ST4m4T.NsKAfqOeJeKx9Fnrun4fG.';

    // We import dynamically so that the config reads the mocked environment above
    const appModule = await import('../src/app.js');
    app = appModule.app;

    // Create an agent to maintain session state across requests
    agent = request.agent(app);
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('GET / redirects to login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login with valid credentials authenticates user', async () => {
    const res = await agent.post('/login')
      .send('username=admin&password=TestPass123')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  test('POST /login with invalid credentials fails', async () => {
    const res = await request(app).post('/login')
      .send('username=admin&password=wrongpassword')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('GET /wizard returns wizard page for authenticated user', async () => {
    const res = await agent.get('/wizard');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });
});
