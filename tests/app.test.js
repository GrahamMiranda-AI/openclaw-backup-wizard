import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import bcryptPkg from 'bcryptjs';

test('App test suite', async (t) => {
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenClawDir = path.join(mockHome, '.openclaw');

  fs.mkdirSync(mockOpenClawDir, { recursive: true });

  const adminPass = 'testpassword';
  const adminHash = bcryptPkg.hashSync(adminPass, 10);

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = adminHash;

  const { app } = await import('../src/app.js');

  await t.test('GET /login should return login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  await t.test('POST /login with valid credentials should redirect', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: adminPass })
      .expect(302);

    assert.strictEqual(res.headers.location, '/wizard');
  });

  // Cleanup
  fs.rmSync(mockHome, { recursive: true, force: true });
});
