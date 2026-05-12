import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import fs from 'fs';

// Mock env vars before app import
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$ZXEKV1NvpPTj1hPFKM5F0Ovtl7Arb6EYXjGBSjW/rRS6WXprSIMuO'; // hash of 'password'

const { app } = await import('../src/app.js');

test('Application routes', async (t) => {
  await t.test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Login'));
  });

  await t.test('POST /login with invalid credentials should fail', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });

  await t.test('POST /login with valid credentials should succeed and redirect', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('GET /wizard without auth should redirect to login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
