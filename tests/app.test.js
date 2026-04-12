import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.PORT = '8080';
process.env.APP_NAME = 'Test Wizard';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('testpass', 10);

const { app } = await import('../src/app.js');

describe('OpenClaw Backup Wizard Tests', () => {
  test('redirects to /login when unauthenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('returns 200 on /login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Test Wizard - Login/);
  });

  test('fails login with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('successful login sets session and redirects', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie'], 'Should set cookie after login');

    const cookie = res.headers['set-cookie'].find(c => c.startsWith('connect.sid='));
    assert.ok(cookie, 'connect.sid cookie should be present');

    // Access protected route with the cookie
    const protectedRes = await request(app)
      .get('/wizard')
      .set('Cookie', cookie);

    assert.strictEqual(protectedRes.status, 200);
    assert.match(protectedRes.text, /Test Wizard - Wizard/);
  });
});
