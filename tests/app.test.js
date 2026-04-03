import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('App routing tests', async (t) => {
  await t.test('GET / should redirect to /login', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /login should render the login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('Login'));
    assert.ok(response.text.includes('Username'));
    assert.ok(response.text.includes('Password'));
  });
});