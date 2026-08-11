import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
const fsp = fs.promises;
import bcryptPkg from 'bcryptjs';
const { hashSync } = bcryptPkg;

describe('App routes', () => {
  let app;
  let mockHomeDir;

  before(async () => {
    // Setup mocked environment
    mockHomeDir = path.join(import.meta.dirname, 'mock_home');
    const mockOpenclawDir = path.join(mockHomeDir, '.openclaw');

    await fsp.mkdir(mockOpenclawDir, { recursive: true });

    process.env.HOME = mockHomeDir;
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = hashSync('testpass123', 10);

    // Import app dynamically after setting mocked env vars
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  after(async () => {
    // Cleanup mocked environment
    if (fs.existsSync(mockHomeDir)) {
      await fsp.rm(mockHomeDir, { recursive: true, force: true });
    }
  });

  test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('POST /login should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login should succeed with valid credentials and set session', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie']);
  });
});
