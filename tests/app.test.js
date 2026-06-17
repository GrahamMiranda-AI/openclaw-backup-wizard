import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$t/klm8URxfJcK5yR2U0RoOI3E7CAYWjeLSvbHsKCNwSVFqHRmnUku'; // 'mytestpassword'

describe('App', async () => {
  const { app } = await import('../src/app.js');

  test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  test('POST /login with correct password should redirect to /wizard', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'mytestpassword' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  test('POST /login with wrong password should return 401', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrongpassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('GET /wizard without auth should redirect to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });
});
