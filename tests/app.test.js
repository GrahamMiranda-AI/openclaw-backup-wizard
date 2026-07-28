import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

const mockHome = path.join(import.meta.dirname, 'mock_home');
fs.mkdirSync(path.join(mockHome, '.openclaw'), { recursive: true });

process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$X8T.X8T.X8T.X8T.X8T.X.X8T.X8T.X8T.X8T.X8T.X8T.X8T.X8'; // Not a valid hash, just needs to exist

// Dynamic import to ensure process.env variables are applied before evaluation
const { app } = await import('../src/app.js');

test('GET /login', async () => {
  const response = await request(app).get('/login');
  assert.strictEqual(response.status, 200);
  assert.match(response.text, /Login/);
});

test('GET / redirects to /login', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.location, '/login');
});

test('POST /login with invalid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpassword' });

  assert.strictEqual(response.status, 401);
  assert.match(response.text, /Invalid login/);
});
