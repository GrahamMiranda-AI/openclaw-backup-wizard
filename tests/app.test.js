import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

describe('App Endpoints', () => {
  test('GET / redirects to /login if unauthenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('GET /login returns the login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Login/);
  });

  test('GET /wizard redirects to /login if unauthenticated', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('POST /logout redirects to /login', async () => {
    const response = await request(app).post('/logout');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });
});
