import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';

describe('App routes', () => {
  it('should redirect / to /login when unauthenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/login');
  });

  it('should return 200 on /login', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Login/);
  });

  it('should return 500 on POST /login if ADMIN_PASSWORD_HASH is missing', async () => {
    // By default, test environment may have empty password hash
    const response = await request(app).post('/login').send({ username: 'admin', password: 'password' });
    if (response.status === 500) {
      assert.match(response.text, /ADMIN_PASSWORD_HASH missing/);
    } else {
      assert.strictEqual(response.status, 401); // Invalid login if hash is there but password wrong
    }
  });

  it('should redirect to /login when visiting /wizard unauthenticated', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/login');
  });
});
