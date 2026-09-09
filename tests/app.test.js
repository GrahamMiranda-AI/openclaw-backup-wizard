import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import bcryptPkg from 'bcryptjs';
import request from 'supertest';

const fsp = fs.promises;
const { hashSync } = bcryptPkg;

const mockHome = path.join(import.meta.dirname, '../mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');

describe('OpenClaw Backup Wizard', () => {
  let app;

  before(async () => {
    // Setup Mock Environment
    await fsp.mkdir(mockOpenclaw, { recursive: true });
    process.env.HOME = mockHome;
    process.env.ADMIN_USER = 'testadmin';
    process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
    process.env.SESSION_SECRET = 'test-secret';

    // Import app dynamically AFTER setting environment variables
    const mod = await import('../src/app.js');
    app = mod.app;
  });

  after(async () => {
    // Cleanup Mock Environment
    if (fs.existsSync(mockHome)) {
      await fsp.rm(mockHome, { recursive: true, force: true });
    }
  });

  test('GET / redirects to /wizard', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login'); // Unauthorized redirects to login
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
    assert.match(res.text, /Username/);
  });

  test('POST /login with valid credentials authenticates', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie']); // Session cookie
  });

  test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpass' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('GET /wizard is protected', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
