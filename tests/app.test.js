import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

test('App Tests', async (t) => {
  // Mock environment setup
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');

  fs.mkdirSync(mockOpenclaw, { recursive: true });

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = 'mocked_hash';

  // Dynamic import after env setup to ensure configs use mock env vars
  const { app } = await import('../src/app.js');

  await t.test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login" class="stack">/);
  });

  await t.test('GET / should redirect to login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  await t.test('GET /wizard should redirect to login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  // Cleanup mock env
  fs.rmSync(mockHome, { recursive: true, force: true });
});
