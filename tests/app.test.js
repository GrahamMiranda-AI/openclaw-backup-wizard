import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
const ADMIN_PASS = 'testpass123';

describe('App Tests', () => {
  let app;

  before(async () => {
    // Mock environment before dynamically loading app.js
    process.env.HOME = MOCK_HOME;
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = hashSync(ADMIN_PASS, 10);
    process.env.SESSION_SECRET = 'test-secret';

    // Create empty openclaw dir to avoid reading host system real directory which causes timeouts
    fs.mkdirSync(path.join(MOCK_HOME, '.openclaw'), { recursive: true });

    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  after(() => {
    fs.rmSync(MOCK_HOME, { recursive: true, force: true });
  });

  test('GET / redirects to /login if unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<form method="post" action="\/login"/);
  });

  test('POST /login with invalid credentials fails', async () => {
    const res = await request(app).post('/login').send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login with valid credentials succeeds and creates session', async () => {
    const res = await request(app).post('/login').send({ username: 'admin', password: ADMIN_PASS });
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    const cookie = res.headers['set-cookie'][0];
    assert.ok(cookie.includes('connect.sid'));

    // Try accessing protected route
    const protectedRes = await request(app).get('/wizard').set('Cookie', cookie);
    assert.strictEqual(protectedRes.statusCode, 200);
    assert.match(protectedRes.text, /Step 1 — Create backup/);
  });
});
