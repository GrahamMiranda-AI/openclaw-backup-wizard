import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

test('App integration tests', async (t) => {
  // Set up mock environment variables BEFORE importing app
  process.env.HOME = path.join(import.meta.dirname, '../mock_home');
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);

  // Dynamically import app so environment variables apply to config
  const { app } = await import('../src/app.js');
  const { attachRoutes } = await import('../src/routes.js');

  attachRoutes(app);

  await t.test('GET /login returns login page', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.text, /Login/);
  });

  await t.test('POST /login with wrong password fails', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    assert.strictEqual(response.status, 401);
  });

  await t.test('POST /login with correct password succeeds', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'testpass' });

    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/wizard');
  });

  await t.test('GET / redirects to login when not authenticated', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 302);
    assert.strictEqual(response.headers.location, '/login');
  });
});
