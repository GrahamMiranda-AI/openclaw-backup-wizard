import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Set up mock process.env variables *before* any app code imports are resolved
process.env.PORT = '3000';
process.env.APP_NAME = 'Test App';
process.env.SESSION_SECRET = 'test-secret';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = 'mockhash';

// Dynamically import the app *after* environment variables are configured
const { app } = await import('../src/app.js');

test('GET / should redirect to /login when unauthenticated', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('GET /login should render the login page', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /<title>Test App - Login<\/title>/);
  assert.match(response.text, /name="username"/);
  assert.match(response.text, /name="password"/);
});
