import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';

test('App functionality', async (t) => {
  // Create a temporary mock HOME directory to prevent tests from modifying or
  // globbing the real ~/.openclaw, which would cause timeouts/errors.
  const mockHome = fs.mkdtempSync(path.join(os.tmpdir(), 'oc-test-'));
  const mockOpenclaw = path.join(mockHome, '.openclaw');
  fs.mkdirSync(mockOpenclaw, { recursive: true });

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = 'mocked-hash';

  // Import app dynamically after environment vars are set
  const { app } = await import('../src/app.js');

  await t.test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
    assert.match(res.text, /Login/);
  });

  await t.test('GET /wizard redirects unauthenticated users', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  t.after(() => {
    // Cleanup temporary mock directory
    fs.rmSync(mockHome, { recursive: true, force: true });
  });
});
