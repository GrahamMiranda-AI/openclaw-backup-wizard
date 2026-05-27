import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

describe('App Routing & Auth', () => {
  let app;

  before(async () => {
    process.env.ADMIN_PASSWORD_HASH = 'mock-hash'; // Needed so login route doesn't error out on missing env
    const mod = await import('../src/app.js');
    app = mod.app;
  });

  test('GET /login returns 200', async () => {
    const res = await request(app).get('/login');
    assert.equal(res.status, 200);
    assert.match(res.text, /Login/);
  });

  test('POST /login with incorrect credentials returns 401', async () => {
    const res = await request(app).post('/login').send({ username: 'admin', password: 'wrongpassword' });
    assert.equal(res.status, 401);
    assert.match(res.text, /Invalid login/);
  });

  test('GET /wizard without authentication redirects to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login');
  });
});
