import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import 'dotenv/config'; // Make sure env vars are loaded for testing
import { app } from '../src/app.js';

test('App routing and basic logic', async (t) => {

  await t.test('GET / should redirect to /login if not authenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('GET /login should serve login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.ok(response.text.includes('<title>OpenClaw Backup Wizard - Login</title>'));
    assert.ok(response.text.includes('<form method="post" action="/login"'));
  });

  await t.test('GET /wizard should redirect to /login if not authenticated', async () => {
    const response = await request(app).get('/wizard');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });

  await t.test('POST /login with incorrect password should fail', async () => {
    const response = await request(app).post('/login').send({
      username: 'admin',
      password: 'wrongpassword'
    });

    // Status should be 401 Unauthorized
    assert.strictEqual(response.status, 401);
    assert.ok(response.text.includes('Invalid login.'));
  });

});
