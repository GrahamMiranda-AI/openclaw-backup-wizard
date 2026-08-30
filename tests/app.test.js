import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

test('App Tests', async (t) => {
  // Set up mock environment variables BEFORE dynamic import
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$wzDz.j2sYTKNBu77jNBGfelvA/nHv0uIsqoIupcRW/swzhtQHXjiO'; // "testpass"

  // Ensure empty .openclaw directory exists in mock home to prevent globbing real user home
  fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });

  const { app } = await import('../src/app.js');

  await t.test('GET /login', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('Login'));
  });

  await t.test('POST /login success', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('GET / redirects to /login if not authed', async () => {
      const res = await request(app).get('/');
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res.headers.location, '/login');
  });

  // Cleanup
  fs.rmSync(mockHome, { recursive: true, force: true });
});
