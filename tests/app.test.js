import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import fs from 'fs';
import path from 'path';

describe('App Tests', async () => {
  let app;
  let mockHomeDir;
  let request;

  before(async () => {
    // Setup mock home directory to avoid testing on real ~/.openclaw
    mockHomeDir = path.join(import.meta.dirname, 'mock_home');
    const openclawDir = path.join(mockHomeDir, '.openclaw');
    fs.mkdirSync(openclawDir, { recursive: true });

    // Ensure mock environment variables are set before dynamically loading the app
    process.env.HOME = mockHomeDir;
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = '$2a$10$s3tR2sGrbVrQQXyoYDzGdO7bjXZF9EoliKrG1F/xEMHfeTTFfUilO'; // hash of 'testpass'

    const appModule = await import('../src/app.js');
    app = appModule.app;
    request = supertest(app);
  });

  after(() => {
    // Cleanup mock home directory
    if (fs.existsSync(mockHomeDir)) {
      fs.rmSync(mockHomeDir, { recursive: true, force: true });
    }
    // Cleanup backups and runtime dirs created during tests
    const backupsDir = path.join(import.meta.dirname, '../backups');
    const runtimeDir = path.join(import.meta.dirname, '../.runtime');
    if (fs.existsSync(backupsDir)) {
      fs.rmSync(backupsDir, { recursive: true, force: true });
    }
    if (fs.existsSync(runtimeDir)) {
      fs.rmSync(runtimeDir, { recursive: true, force: true });
    }
  });

  test('GET /login should return 200 OK', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('POST /backup should create a zip file and redirect when authenticated', async () => {
    // Create an authenticated session via agent
    const agent = supertest.agent(app);
    const loginRes = await agent.post('/login').send({
      username: 'testadmin',
      password: 'testpass'
    });

    assert.strictEqual(loginRes.status, 302); // Redirect to wizard after successful login
    assert.strictEqual(loginRes.headers.location, '/wizard');

    // Trigger backup
    const backupRes = await agent.post('/backup');
    assert.strictEqual(backupRes.status, 302);
    assert.match(backupRes.headers.location, /^\/wizard\?ok=/);

    // Verify a zip file was created in backups dir
    const backupsDir = path.join(import.meta.dirname, '../backups');
    const files = fs.readdirSync(backupsDir);
    const zipFiles = files.filter(f => f.endsWith('.zip'));
    assert.ok(zipFiles.length > 0, 'Backup ZIP file should be created');
  });

  test('POST /backup should redirect to login when unauthenticated', async () => {
    const res = await request.post('/backup');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
