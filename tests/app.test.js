import { test } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';

process.env.PORT = '4281';
process.env.APP_NAME = 'Test App';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = 'mock-hash';
process.env.LOGO_PATH = '/static/test-logo.jpg';
process.env.HOME = '/tmp/test-home';

const { app } = await import('../src/app.js');

test('GET /login returns 200 OK', async () => {
  const response = await supertest(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('GET / redirects to /login when unauthenticated', async () => {
  const response = await supertest(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});
