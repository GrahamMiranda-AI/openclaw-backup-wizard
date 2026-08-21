import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg.default || bcryptPkg;
const fsp = fs.promises;

test('Authentication flows and protected routes', async (t) => {
  const testHome = path.join(import.meta.dirname, 'mock_home');
  const testOpenClawDir = path.join(testHome, '.openclaw');

  await fsp.mkdir(testOpenClawDir, { recursive: true });

  const adminPass = 'test-pass';
  process.env.HOME = testHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = hashSync(adminPass, 10);
  process.env.SESSION_SECRET = 'test-secret';

  const { app } = await import('../src/app.js');

  await t.test('GET /login renders login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  await t.test('GET /wizard redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  let sessionCookie = '';

  await t.test('POST /login authenticates correctly', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: adminPass })
      .expect(302);

    assert.strictEqual(res.headers.location, '/wizard');
    sessionCookie = res.headers['set-cookie'].find(c => c.startsWith('connect.sid='));
    assert.ok(sessionCookie);
  });

  await t.test('GET /wizard works with valid session', async () => {
    const res = await request(app)
      .get('/wizard')
      .set('Cookie', sessionCookie)
      .expect(200);

    assert.match(res.text, /Step 1 — Create backup/);
  });

  await t.test('POST /logout destroys session', async () => {
    const res = await request(app)
      .post('/logout')
      .set('Cookie', sessionCookie)
      .expect(302);

    assert.strictEqual(res.headers.location, '/login');

    const wizardRes = await request(app).get('/wizard').set('Cookie', res.headers['set-cookie'] || []);
    assert.strictEqual(wizardRes.statusCode, 302);
  });
});
