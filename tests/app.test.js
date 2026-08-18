import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import bcryptPkg from 'bcryptjs';

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('testpass123', 10);
process.env.SESSION_SECRET = 'test-secret';
process.env.PORT = '4281';

let app;

describe('OpenClaw Backup Wizard', () => {
  before(async () => {
    fs.mkdirSync(mockOpenclaw, { recursive: true });

    // Dynamically import app after env vars are set
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  after(() => {
    if (fs.existsSync(mockHome)) {
      fs.rmSync(mockHome, { recursive: true, force: true });
    }
  });

  test('setup verification', () => {
    assert.ok(app);
  });

  test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('<h2>Login</h2>'));
    assert.ok(res.text.includes('name="username"'));
    assert.ok(res.text.includes('name="password"'));
  });

  test('POST /login fails with incorrect credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' })
      .type('form');

    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });

  test('POST /login succeeds with correct credentials and redirects to wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' })
      .type('form');

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Check that session cookie is set
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Expected set-cookie header');
    assert.ok(cookies.some(c => c.startsWith('connect.sid=')));
  });

  test('GET /wizard redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard renders wizard page when authenticated', async () => {
    // 1. Login to get a session
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' })
      .type('form');
    const cookies = loginRes.headers['set-cookie'];

    // 2. Access wizard with the session
    const res = await request(app)
      .get('/wizard')
      .set('Cookie', cookies);

    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('<h2>Step 1 — Create backup</h2>'));
  });

  test('POST /backup creates a backup and redirects', async () => {
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' })
      .type('form');
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/backup')
      .set('Cookie', cookies);

    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.startsWith('/wizard?ok='));
  });

  test('GET /download/:name and POST /delete-backup works', async () => {
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' })
      .type('form');
    const cookies = loginRes.headers['set-cookie'];

    // Backup first
    const backupRes = await request(app).post('/backup').set('Cookie', cookies);
    const loc = backupRes.headers.location;
    const okParam = new URLSearchParams(loc.split('?')[1]).get('ok');
    const filename = okParam.replace('Backup created: ', '');

    // Download test
    const downloadRes = await request(app)
      .get(`/download/${filename}`)
      .set('Cookie', cookies);
    assert.strictEqual(downloadRes.status, 200);
    assert.strictEqual(downloadRes.headers['content-type'], 'application/zip');

    // Delete test
    const deleteRes = await request(app)
      .post('/delete-backup')
      .set('Cookie', cookies)
      .send({ name: filename })
      .type('form');

    assert.strictEqual(deleteRes.status, 302);
    assert.ok(deleteRes.headers.location.startsWith('/wizard?ok=Backup%20deleted'));
  });

  test('POST /restore handles backup upload', async () => {
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass123' })
      .type('form');
    const cookies = loginRes.headers['set-cookie'];

    // Backup first to have a valid file to restore
    const backupRes = await request(app).post('/backup').set('Cookie', cookies);
    const loc = backupRes.headers.location;
    const okParam = new URLSearchParams(loc.split('?')[1]).get('ok');
    const filename = okParam.replace('Backup created: ', '');
    const backupPath = path.join(import.meta.dirname, '../backups', filename);

    // Restore test
    const restoreRes = await request(app)
      .post('/restore')
      .set('Cookie', cookies)
      .field('confirm', 'yes')
      .attach('backup', backupPath);

    assert.strictEqual(restoreRes.status, 302);
    assert.ok(restoreRes.headers.location.startsWith('/wizard?ok=Restore%20completed'));
  });
});
