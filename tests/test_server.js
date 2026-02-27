const { test, describe, before, after, mock } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Mock configuration before loading the app
const mockConfig = {
  PORT: 4000,
  APP_NAME: 'Test App',
  SESSION_SECRET: 'test-secret',
  ADMIN_USER: 'admin',
  ADMIN_PASSWORD_HASH: bcrypt.hashSync('password123', 10),
  LOGO_PATH: '/static/logo.jpg',
  HOME_DIR: '/tmp/test-home',
  OPENCLAW_DIR: '/tmp/test-home/.openclaw',
  WORKSPACE_DIR: '/tmp/test-home/.openclaw/workspace',
  BACKUP_DIR: '/tmp/test-backups',
  RUNTIME_DIR: '/tmp/test-runtime',
  UPLOAD_DIR: '/tmp/test-runtime/uploads',
  TMP_RESTORE_DIR: '/tmp/test-runtime/restore',
  WORKSPACE_FILES: ['test.md'],
  ROOT_DIR: process.cwd()
};

// Manually mock the module by overriding require or using a different approach
// Since node:test mock.module is experimental or not available in this version context,
// we will use a different strategy or just rely on env vars if possible,
// but here we are stuck with require. Let's try to overwrite the file temporarily or use a proxy.
// Given the environment, let's try to inject the config by modifying the require cache.

const configPath = require.resolve('../src/config');
require.cache[configPath] = {
  id: configPath,
  filename: configPath,
  loaded: true,
  exports: mockConfig
};

const app = require('../server');

describe('OpenClaw Backup Wizard Tests', () => {
  let agent;

  // Setup test directories
  if (!fs.existsSync(mockConfig.BACKUP_DIR)) fs.mkdirSync(mockConfig.BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(mockConfig.OPENCLAW_DIR)) fs.mkdirSync(mockConfig.OPENCLAW_DIR, { recursive: true });
  if (!fs.existsSync(mockConfig.WORKSPACE_DIR)) fs.mkdirSync(mockConfig.WORKSPACE_DIR, { recursive: true });
  fs.writeFileSync(path.join(mockConfig.WORKSPACE_DIR, 'test.md'), 'test content');

  agent = request.agent(app);

  after(() => {
    // Cleanup
    try {
      fs.rmSync(mockConfig.BACKUP_DIR, { recursive: true, force: true });
      fs.rmSync(mockConfig.OPENCLAW_DIR, { recursive: true, force: true });
      fs.rmSync(mockConfig.RUNTIME_DIR, { recursive: true, force: true });
      fs.rmSync('/tmp/test-home', { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  test('GET / redirects to /login when not authenticated', async () => {
    const res = await agent.get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns login page', async () => {
    const res = await agent.get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('Welcome Back'));
  });

  test('POST /login with invalid credentials fails', async () => {
    const res = await agent.post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
    assert.ok(res.text.includes('Invalid username or password'));
  });

  test('POST /login with valid credentials succeeds', async () => {
    const res = await agent.post('/login')
      .send({ username: 'admin', password: 'password123' });
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  test('GET /wizard returns wizard page when authenticated', async () => {
    const res = await agent.get('/wizard');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('Create Backup'));
  });

  test('POST /backup creates a backup zip', async () => {
    const res = await agent.post('/backup');
    assert.strictEqual(res.statusCode, 302);
    assert.ok(res.headers.location.includes('ok=Backup%20created'));

    const files = fs.readdirSync(mockConfig.BACKUP_DIR);
    assert.strictEqual(files.length, 1);
    assert.ok(files[0].endsWith('.zip'));
  });

  test('POST /logout redirects to login', async () => {
    const res = await agent.post('/logout');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard redirects to login after logout', async () => {
    // Ensure we are logged out by creating a new agent or just relying on the previous logout
    const res = await agent.get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
