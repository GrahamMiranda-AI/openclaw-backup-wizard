import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

describe('App Routes', () => {
  let app;

  before(async () => {
    // Setup environment securely before initializing app configuration via hoisting
    process.env.SESSION_SECRET = 'test-secret';
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASSWORD_HASH = 'mocked-hash';
    process.env.BACKUP_DIR = './backups';

    // Import app dynamically
    const module = await import('../src/app.js');
    app = module.app;
  });

  test('GET /login returns availability to login', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Login/);
  });

  test('GET / wizard redirects to login when unauthorized', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  test('GET / redirects to /login when unauthorized', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });
});
