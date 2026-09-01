import { test, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import fsp from 'fs/promises';

const mockHome = path.join(import.meta.dirname, '../mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');

before(async () => {
  process.env.HOME = mockHome;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = '$2a$10$wO0Q3R/GfP.M8J.XQ.Z60umB1h5L/lH8O3Q3R/GfP.M8J.XQ.Z60u'; // hash for 'password'

  await fsp.mkdir(mockOpenclaw, { recursive: true });
});

after(async () => {
  if (fs.existsSync(mockHome)) {
    await fsp.rm(mockHome, { recursive: true, force: true });
  }
});

test('App routes and authentication', async (t) => {
  const { app } = await import('../src/app.js');
  await import('../src/routes.js'); // load routes

  await t.test('GET /login should return 200', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('GET /wizard without auth should redirect to /login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  let cookie;

  await t.test('POST /login with invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
  });
});
