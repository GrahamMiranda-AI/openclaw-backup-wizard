import { test, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

let app;

before(async () => {
  const mockHome = path.join(import.meta.dirname, 'mock_home');
  const mockOpenclaw = path.join(mockHome, '.openclaw');
  fs.mkdirSync(mockOpenclaw, { recursive: true });

  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$B4Zk0gdllVnh5GT6TJY6WujnBCfcEV2BWfGM9jhee717PG23eThXC'; // hash for 'testpassword123'
  process.env.SESSION_SECRET = 'testsecret';

  const appModule = await import('../src/app.js');
  app = appModule.app;
});

test('Unauthenticated user is redirected to /login when visiting /wizard', async () => {
  const response = await request(app).get('/wizard');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('Successful login creates session and redirects to /wizard', async () => {
  const response = await request(app)
    .post('/login')
    .send('username=admin&password=testpassword123');

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/wizard');

  const cookies = response.headers['set-cookie'];
  assert.ok(cookies && cookies.length > 0);
  assert.ok(cookies[0].includes('connect.sid'));
});

test('Unsuccessful login returns 401', async () => {
  const response = await request(app)
    .post('/login')
    .send('username=admin&password=wrongpassword');

  assert.strictEqual(response.status, 401);
});
