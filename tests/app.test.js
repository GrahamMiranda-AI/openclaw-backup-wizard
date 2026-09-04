import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

const MOCK_HOME = path.join(import.meta.dirname, 'mock_home');
const MOCK_OPENCLAW = path.join(MOCK_HOME, '.openclaw');

test('Backup Wizard App Tests', async (t) => {
  // Set up environment before importing the app
  process.env.HOME = MOCK_HOME;
  process.env.ADMIN_USER = 'testadmin';
  process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);

  // Create mock home dir to prevent test timeouts trying to read host machine
  fs.mkdirSync(MOCK_OPENCLAW, { recursive: true });

  const { app } = await import('../src/app.js');

  await t.test('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.text, /Login/);
  });

  await t.test('POST /login with valid credentials should redirect', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'testpass' });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/wizard');
  });

  await t.test('POST /login with invalid credentials should fail', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'testadmin', password: 'wrong' });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.text, /Invalid login/);
  });

  await t.test('GET /wizard unauthenticated should redirect to login', async () => {
    const res = await request(app).get('/wizard');
    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/login');
  });

  // Cleanup
  fs.rmSync(MOCK_HOME, { recursive: true, force: true });
});
