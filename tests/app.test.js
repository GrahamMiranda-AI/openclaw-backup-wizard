import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('App Routing and Auth', async (t) => {

  await t.test('GET / should redirect to /login when unauthenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /login should render the login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /<title>.*Login<\/title>/);
    assert.match(response.text, /Sign in/);
  });

  await t.test('GET /wizard should redirect to /login when unauthenticated', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });
});
