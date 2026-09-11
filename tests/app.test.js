import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import fs from 'fs';
import path from 'path';

test('App test suite', async (t) => {
  // Mock home directory for tests to avoid scanning real directories
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');

  if (!fs.existsSync(mockOpenclaw)) {
    fs.mkdirSync(mockOpenclaw, { recursive: true });
  }

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';

  // Set mock password to "password123"
  const bcryptPkg = await import('bcryptjs');
  const { hashSync } = bcryptPkg.default || bcryptPkg;
  process.env.ADMIN_PASSWORD_HASH = hashSync('password123', 10);

  const { app } = await import('../src/app.js');
  const request = supertest(app);

  await t.test('GET / should redirect to /login when unauthenticated', async () => {
    const res = await request.get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login should display the login form', async () => {
    const res = await request.get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.text.includes('<form method="post" action="/login"'));
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request.post('/login').send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });

  await t.test('POST /login with valid credentials succeeds and redirects to /wizard', async () => {
    const res = await request.post('/login').send({ username: 'admin', password: 'password123' });
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  // Clean up
  if (fs.existsSync(mockHome)) {
    fs.rmSync(mockHome, { recursive: true, force: true });
  }
});
