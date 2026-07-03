import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';

let app;

describe('OpenClaw Backup Wizard', () => {
  before(async () => {
    // Set up environment before importing the app
    process.env.PORT = '4281';
    process.env.APP_NAME = 'Test Wizard';
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = 'test-hash';

    const mod = await import('../src/app.js');
    app = mod.app;
  });

  test('app initializes directories', async () => {
    const { BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR } = await import('../src/config.js');
    assert.strictEqual(fs.existsSync(BACKUP_DIR), true);
    assert.strictEqual(fs.existsSync(RUNTIME_DIR), true);
    assert.strictEqual(fs.existsSync(UPLOAD_DIR), true);
    assert.strictEqual(fs.existsSync(TMP_RESTORE_DIR), true);
  });

  test('GET / redirects to /login if unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard redirects to /login if unauthenticated', async () => {
    const res2 = await request(app).get('/wizard');
    assert.strictEqual(res2.status, 302);
    assert.strictEqual(res2.headers.location, '/login');
  });

  test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<title>Test Wizard - Login<\/title>/);
    assert.match(res.text, /Login/);
  });
});
