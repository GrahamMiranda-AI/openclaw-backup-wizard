import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

const mockHomeDir = path.join(import.meta.dirname, 'mock_home');
const mockOpenclawDir = path.join(mockHomeDir, '.openclaw');
fs.mkdirSync(mockOpenclawDir, { recursive: true });

process.env.HOME = mockHomeDir;
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('testpass', 10);

const { app } = await import('../src/app.js');

test('GET /login returns login page', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.statusCode, 200);
  assert.match(res.text, /Login/);
});

test('POST /login successfully authenticates', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });

  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('GET /wizard redirects to login if unauthenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('GET /wizard allows access if authenticated', async () => {
  const agent = request.agent(app);

  await agent
    .post('/login')
    .send({ username: 'admin', password: 'testpass' });

  const res = await agent.get('/wizard');
  assert.strictEqual(res.statusCode, 200);
  assert.match(res.text, /Create backup/);
});
