import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App Tests', () => {
  let app;

  before(async () => {
    // Mock process.env variables before importing the app
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = 'mock-hash'; // Not doing actual login so mock is fine

    // Dynamically import the app after setting environment variables
    const mod = await import('../src/app.js');
    app = mod.app;
  });

  test('GET / should redirect to /login when not authenticated', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /wizard should redirect to /login when not authenticated', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /<title>.*Login<\/title>/);
    assert.match(res.text, /name="username"/);
    assert.match(res.text, /name="password"/);
  });
});
