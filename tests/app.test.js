import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

describe('OpenClaw Backup Wizard Tests', () => {
  let app;
  let BACKUP_DIR, RUNTIME_DIR, UPLOAD_DIR, TMP_RESTORE_DIR;

  before(async () => {
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = 'mocked-hash';
    process.env.SESSION_SECRET = 'test-secret';

    const config = await import('../src/config.js');
    BACKUP_DIR = config.BACKUP_DIR;
    RUNTIME_DIR = config.RUNTIME_DIR;
    UPLOAD_DIR = config.UPLOAD_DIR;
    TMP_RESTORE_DIR = config.TMP_RESTORE_DIR;

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  test('critical directories are initialized', () => {
    assert.ok(fs.existsSync(BACKUP_DIR), 'BACKUP_DIR should exist');
    assert.ok(fs.existsSync(RUNTIME_DIR), 'RUNTIME_DIR should exist');
    assert.ok(fs.existsSync(UPLOAD_DIR), 'UPLOAD_DIR should exist');
    assert.ok(fs.existsSync(TMP_RESTORE_DIR), 'TMP_RESTORE_DIR should exist');
  });

  test('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('<title>OpenClaw Backup Wizard - Login</title>'));
    assert.ok(res.text.includes('<form method="post" action="/login" class="stack">'));
  });

  test('GET / should redirect to /login if unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard should redirect to /login if unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
