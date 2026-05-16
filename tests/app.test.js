import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'password123';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

process.env.ADMIN_USER = ADMIN_USER;
process.env.ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH;

const { app } = await import('../src/app.js');

test('App integration tests', async (t) => {
  await t.test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
    assert.match(res.text, /<form/);
  });

  await t.test('GET /wizard without auth should redirect to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('POST /login with valid credentials should redirect to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send(`username=${ADMIN_USER}&password=${ADMIN_PASSWORD}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Check that session cookie was set
    assert.ok(res.headers['set-cookie'].some(cookie => cookie.startsWith('connect.sid=')));
  });

  await t.test('POST /login with invalid credentials should return 401', async () => {
    const res = await request(app)
      .post('/login')
      .send(`username=${ADMIN_USER}&password=wrongpassword`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });
});
