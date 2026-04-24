import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

test('App responds and handles unauthenticated requests', async (t) => {
  // Set mock environment variables
  process.env.PORT = '3000';
  process.env.APP_NAME = 'Test Wizard';
  process.env.SESSION_SECRET = 'test-secret';

  // Dynamically import app after setting mock environment variables
  const { app } = await import('../src/app.js');

  await t.test('GET / should redirect to /login when not authenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/login');
  });

  await t.test('GET /wizard should redirect to /login when not authenticated', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.header.location, '/login');
  });

  await t.test('GET /login should render the login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Test Wizard - Login/);
    assert.match(response.text, /Sign in/);
  });
});
