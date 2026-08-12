import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';

test('App routing and basic structure', async (t) => {
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');

  await fsp.mkdir(mockOpenclaw, { recursive: true });

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$HJnbnQcPVu2Ifjbxcy2MLe4ECA.nDO4IMDu4Ab2rwx55b05i/m6Se';
  process.env.SESSION_SECRET = 'test-secret';

  const { app } = await import('../src/app.js');
  const request = supertest(app);

  await t.test('GET /login returns 200', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<title>OpenClaw Backup Wizard - Login<\/title>/);
  });

  await t.test('GET / redirects to /login when unauthenticated', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login when unauthenticated', async () => {
    const res = await request.get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await fsp.rm(mockHome, { recursive: true, force: true });
});