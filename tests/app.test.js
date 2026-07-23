import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

process.env.PORT = '3000';
process.env.APP_NAME = 'Test App';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);

const { app } = await import('../src/app.js');

describe('App Tests', () => {
  test('GET / redirects to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login returns login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Login'));
  });

  test('POST /login with correct credentials authenticates and redirects to /wizard', async () => {
    const res = await request(app).post('/login').send({
      username: 'testadmin',
      password: 'testpass'
    });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/wizard');
    assert.ok(res.headers['set-cookie']);
  });

  test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request(app).post('/login').send({
      username: 'testadmin',
      password: 'wrongpass'
    });
    assert.strictEqual(res.status, 401);
    assert.ok(res.text.includes('Invalid login.'));
  });
});
