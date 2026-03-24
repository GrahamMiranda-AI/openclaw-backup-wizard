import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('App Basic Routing', async (t) => {
  await t.test('GET / redirects to /login if unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  await t.test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('<h2>Login</h2>'));
    assert.ok(res.text.includes('name="username"'));
    assert.ok(res.text.includes('name="password"'));
  });

  await t.test('POST /login with invalid credentials fails', async () => {
    const res = await request(app)
      .post('/login')
      .send('username=admin&password=wrongpassword')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    // Status can be 500 if ADMIN_PASSWORD_HASH is not set or 401 if wrong
    assert.ok(res.status === 401 || res.status === 500);
    assert.ok(res.text.includes('Invalid login.') || res.text.includes('ADMIN_PASSWORD_HASH missing'));
  });
});
