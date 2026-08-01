import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcryptPkg from 'bcryptjs';

const mockHome = path.join(import.meta.dirname, 'mock_home');
const mockOpenclaw = path.join(mockHome, '.openclaw');
const mockWorkspace = path.join(mockOpenclaw, 'workspace');

// Setup environment before dynamic import
process.env.HOME = mockHome;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = bcryptPkg.hashSync('testpass', 10);
process.env.SESSION_SECRET = 'test-secret';

fs.mkdirSync(mockWorkspace, { recursive: true });
fs.writeFileSync(path.join(mockWorkspace, 'AGENTS.md'), 'test');

const { app } = await import('../src/app.js');

test('GET /login', async () => {
  const res = await request(app).get('/login');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /<form method="post" action="\/login"/);
});

test('POST /login success', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'testpass' });

  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/wizard');
});

test('POST /login failure', async () => {
  const res = await request(app)
    .post('/login')
    .send({ username: 'testadmin', password: 'wrongpass' });

  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Invalid login/);
});

test('GET /wizard unauthenticated', async () => {
  const res = await request(app).get('/wizard');
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, '/login');
});

test('Cleanup', () => {
  fs.rmSync(mockHome, { recursive: true, force: true });
});
