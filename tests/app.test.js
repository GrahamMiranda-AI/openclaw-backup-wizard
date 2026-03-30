import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { ADMIN_USER } from '../src/config.js';
import bcrypt from 'bcryptjs';

// Setup basic environment variables for testing
// Important: mock out config values directly if needed

test('App Endpoints', async (t) => {
  await t.test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /login returns HTML', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /<html/);
    assert.match(res.text, /Login/);
  });

  // Note: /login relies on ADMIN_PASSWORD_HASH from config.js, which has already evaluated
  // before we can mock it here easily in this ESM context. We'll skip deep POST login tests
  // without a proper mock container, and just test that the route exists.
  await t.test('POST /login with wrong credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('GET /wizard without authentication redirects to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

});
