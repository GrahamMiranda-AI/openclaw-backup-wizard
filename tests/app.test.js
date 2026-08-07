import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

describe('App routing', () => {
  let app;

  before(async () => {
    const mockHome = path.join(import.meta.dirname, 'mock_home');
    fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });

    process.env.HOME = mockHome;
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('password123', 10);
    process.env.SESSION_SECRET = 'test-secret';

    const m = await import('../src/app.js');
    app = m.app;
  });

  test('GET / unauthenticated redirects to /login', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login renders properly', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('<h2>Login</h2>'));
    assert.ok(res.text.includes('name="username"'));
    assert.ok(res.text.includes('name="password"'));
  });

  test('POST /login valid credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password123' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie']);
  });

  test('POST /login invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });
});
