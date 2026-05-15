import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Set up process.env mocks *before* importing the app
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('password123', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');

describe('OpenClaw Backup Wizard', () => {
  test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Login/);
  });

  test('POST /login with correct credentials redirects to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(302);
    assert.strictEqual(res.headers.location, '/wizard');

    // Check session cookie is set
    assert.ok(res.headers['set-cookie']);
  });

  test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' })
      .expect(401);
    assert.match(res.text, /Invalid login/);
  });
});
