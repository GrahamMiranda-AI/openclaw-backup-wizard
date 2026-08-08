import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Set up test environment variables
process.env.HOME = path.join(import.meta.dirname, 'mock_home');
process.env.ADMIN_USER = 'admin';
import bcryptPkg from 'bcryptjs';
const { hashSync } = bcryptPkg;
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

// Create mock home directory structure
const mockHome = process.env.HOME;
const openclawDir = path.join(mockHome, '.openclaw');
fs.mkdirSync(openclawDir, { recursive: true });

// Dynamic import of app ensures environment variables are applied
const { app } = await import('../src/app.js');

test('Backup Wizard Application Tests', async (t) => {
  let cookies;

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
    assert.match(res.text, /<form/);
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('POST /login with valid credentials succeeds', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Save cookies for authenticated requests
    cookies = res.headers['set-cookie'];
  });

  await t.test('GET /wizard is accessible when authenticated', async () => {
    const res = await request(app)
      .get('/wizard')
      .set('Cookie', cookies);

    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Step 1 — Create backup/);
  });

  await t.test('POST /logout redirects to /login', async () => {
    const res = await request(app)
      .post('/logout')
      .set('Cookie', cookies);

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard is inaccessible after logout', async () => {
    const res = await request(app)
      .get('/wizard');

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  t.after(() => {
    if (fs.existsSync(mockHome)) {
      fs.rmSync(mockHome, { recursive: true, force: true });
    }
  });
});
