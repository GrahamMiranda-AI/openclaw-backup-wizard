import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-calculate hash for "password123" to use in tests.
const TEST_PASSWORD = 'password123';
const TEST_HASH = '$2a$10$IoxFQTVCgXYjDjI8EEKu5OhVXkE58HxWsnmMcVf5/ZTOJd.R3Y7ke';

// Mock environment setup
process.env.HOME = path.join(__dirname, 'mock_home');
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = TEST_HASH;

// Ensure .openclaw directory exists in mocked HOME
fs.mkdirSync(path.join(process.env.HOME, '.openclaw'), { recursive: true });

test('Application Routes', async (t) => {
  // Dynamically import app *after* environment has been mocked
  const { app } = await import('../src/app.js');

  await t.test('GET / redirects to /wizard', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard unauthenticated redirects to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('POST /login with valid credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: TEST_PASSWORD });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Attempting to visit /wizard with session cookie
    const cookie = res.headers['set-cookie'][0];
    const wizardRes = await request(app)
      .get('/wizard')
      .set('Cookie', cookie);

    assert.strictEqual(wizardRes.status, 200);
    assert.match(wizardRes.text, /Step 1 — Create backup/);
  });
});
