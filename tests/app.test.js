import test from 'node:test';
import assert from 'node:assert';
import { after } from 'node:test';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

test('App Tests', async (t) => {
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');

  // Set up mock environment variables before importing app
  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  // Note: bcryptjs hashes the password differently on each run.
  // Let's use a known static hash for testing: 'testpass' hashed with salt rounds 10.
  // We can just use the hash from the reset-password script:
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$WR0P48OcpX6zU5Re7LloyO3gMDnPeTPglmTXyks1JTEnw29BjMfwq';

  fs.mkdirSync(mockOpenclaw, { recursive: true });

  const { app } = await import('../src/app.js');
  const { BACKUP_DIR } = await import('../src/config.js');

  await t.test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });

  await t.test('POST /login with valid credentials succeeds', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' }); // Uses the hash we set
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('GET /wizard requires authentication', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /backup works when authenticated', async () => {
    // Need to login to get the cookie
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' });
    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/backup')
      .set('Cookie', cookie);

    assert.strictEqual(res.status, 302);

    // Check if the redirect location is correct
    const location = res.headers.location;
    assert.ok(location.startsWith('/wizard?ok='));

    // Use URLSearchParams for assertions
    const url = new URL(`http://localhost${location}`);
    const params = new URLSearchParams(url.search);
    const okParam = params.get('ok');

    assert.ok(okParam.includes('Backup created'));
  });

  // Cleanup
  after(() => {
    fs.rmSync(mockHome, { recursive: true, force: true });
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    // also remove .runtime
    const runtime = path.join(import.meta.dirname, '../.runtime');
    fs.rmSync(runtime, { recursive: true, force: true });
  });
});
