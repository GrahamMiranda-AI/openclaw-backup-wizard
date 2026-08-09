import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

const { hashSync } = bcryptPkg;

const mockHome = path.join(import.meta.dirname, 'mock_home');
if (!fs.existsSync(mockHome)) {
  fs.mkdirSync(mockHome, { recursive: true });
}
const mockOpenclaw = path.join(mockHome, '.openclaw');
if (!fs.existsSync(mockOpenclaw)) {
  fs.mkdirSync(mockOpenclaw, { recursive: true });
}

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Login/);
});

test('POST /login fails with wrong credentials', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('POST /login succeeds with correct credentials and redirects', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('GET / without auth redirects to /login', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /wizard without auth redirects to /login', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});
