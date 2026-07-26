import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

let app;

describe('OpenClaw Backup Wizard API Tests', () => {
  before(async () => {
    // Set dummy env variables for test
    process.env.ADMIN_USER = 'admin';

    // Hash for 'password'
    process.env.ADMIN_PASSWORD_HASH = '$2a$10$Bx0hIm.xXbWaZlkRp/vydujCVKs39fu3jKcUDuW/6N5qX3UMW3SyW';
    process.env.SESSION_SECRET = 'test-secret';

    // Dynamically import app so environment variables are registered
    const module = await import('../src/app.js');
    app = module.app;
  });

  test('GET / should redirect to login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard should redirect to login when unauthenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('POST /login with valid credentials should succeed', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.match(res.headers['set-cookie'][0], /connect.sid=/);
  });

  test('POST /login with invalid credentials should fail', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
