import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

test('App starts up and serves login page', async (t) => {
  // Set mock environment variables before importing app
  process.env.PORT = 4281;
  process.env.APP_NAME = 'Test Wizard';
  process.env.SESSION_SECRET = 'test-secret';

  const { app } = await import('../src/app.js');

  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.ok(response.text.includes('Test Wizard - Login'));
});
