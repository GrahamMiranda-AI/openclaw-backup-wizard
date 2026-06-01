import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('password123', 10);
process.env.PORT = '4281';

const { app } = await import('../src/app.js');

describe('App Routes', () => {
  test('GET / should redirect to /login when not authenticated', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login');
  });

  test('GET /login should render the login page', async () => {
    const res = await request(app).get('/login');
    assert.equal(res.status, 200);
    assert.match(res.text, /<title>OpenClaw Backup Wizard - Login<\/title>/);
    assert.match(res.text, /name="username"/);
    assert.match(res.text, /name="password"/);
  });

  test('POST /login with invalid credentials should fail', async () => {
    const res = await request(app).post('/login').send({
      username: 'admin',
      password: 'wrongpassword'
    });
    assert.equal(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('POST /login with valid credentials should succeed and redirect', async () => {
    const res = await request(app).post('/login').send({
      username: 'admin',
      password: 'password123'
    });
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/wizard');

    // Verify session cookie is set
    assert.ok(res.headers['set-cookie']);
  });

  test('GET /wizard requires authentication', async () => {
     const res = await request(app).get('/wizard');
     assert.equal(res.status, 302);
     assert.equal(res.headers.location, '/login');
  });
});
