import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Setup mock environment variables before dynamic imports
const mockHome = path.join(import.meta.dirname, 'mock_home');
process.env.HOME = mockHome;
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$xyz123mockhash'; // Mock hash
process.env.SESSION_SECRET = 'test-secret';

// Ensure mock directories exist to prevent backup errors/timeouts
fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });

test('OpenClaw Backup Wizard Tests', async (t) => {
  // Dynamically import app after env vars are set
  const { app } = await import('../src/app.js');
  const agent = request.agent(app); // Use agent to persist cookies

  await t.test('GET / redirects to login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app).post('/login').send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
