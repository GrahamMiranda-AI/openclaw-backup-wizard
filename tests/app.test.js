import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg.default || bcryptPkg;

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');

describe('App', () => {
  let app;
  let testUser = 'admin';
  let testPass = 'supersecret';
  let testCookie;

  before(async () => {
    // Setup Mock Environment
    fs.mkdirSync(mockOpenclaw, { recursive: true });

    process.env.HOME = mockHome;
    process.env.ADMIN_USER = testUser;
    process.env.ADMIN_PASSWORD_HASH = hashSync(testPass, 10);
    process.env.SESSION_SECRET = 'test-secret';
    process.env.APP_NAME = 'Test Wizard';

    // Dynamic import to use mock variables set above
    const mod = await import('../src/app.js');
    app = mod.app;
  });

  it('directory initialization creates required folders', () => {
    const RUNTIME_DIR = path.join(import.meta.dirname, '../.runtime');
    const BACKUP_DIR = path.join(import.meta.dirname, '../backups');

    assert.strictEqual(fs.existsSync(RUNTIME_DIR), true);
    assert.strictEqual(fs.existsSync(BACKUP_DIR), true);
  });

  it('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  it('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  it('POST /login logs in successfully', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: testUser, password: testPass });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    testCookie = res.headers['set-cookie'];
  });

  it('POST /login fails with wrong credentials', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: testUser, password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  it('GET /wizard works when authenticated', async () => {
    const res = await request(app).get('/wizard').set('Cookie', testCookie);
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });

  it('POST /backup works when authenticated', async () => {
     const res = await request(app).post('/backup').set('Cookie', testCookie);
     assert.strictEqual(res.status, 302);
     assert.match(res.headers.location, /\/wizard\?ok=Backup%20created/);
  });
});
